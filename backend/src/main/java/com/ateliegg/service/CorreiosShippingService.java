package com.ateliegg.service;

import com.ateliegg.config.AtelieProperties;
import com.ateliegg.dto.shipping.ShippingQuoteRequest;
import com.ateliegg.dto.shipping.ShippingQuoteResponse;
import com.ateliegg.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Cotação de frete PAC/SEDEX.
 * A API pública legada dos Correios (CalcPrecoPrazo) encontra-se instável/desligada;
 * usamos tabela regional por UF (ViaCEP) como fonte principal e tentamos a API
 * legada apenas em background curto — sem bloquear o checkout.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CorreiosShippingService {

    public static final String PAC_CODE = "04510";
    public static final String SEDEX_CODE = "04014";

    private static final Map<String, String> SERVICE_NAMES = Map.of(
            PAC_CODE, "PAC",
            SEDEX_CODE, "SEDEX"
    );

    private static final Map<String, Integer> UF_REGION = Map.ofEntries(
            Map.entry("AC", 5), Map.entry("AL", 4), Map.entry("AP", 5), Map.entry("AM", 5),
            Map.entry("BA", 4), Map.entry("CE", 4), Map.entry("DF", 3), Map.entry("ES", 2),
            Map.entry("GO", 3), Map.entry("MA", 4), Map.entry("MT", 3), Map.entry("MS", 3),
            Map.entry("MG", 2), Map.entry("PA", 5), Map.entry("PB", 4), Map.entry("PR", 2),
            Map.entry("PE", 4), Map.entry("PI", 4), Map.entry("RJ", 2), Map.entry("RN", 4),
            Map.entry("RS", 3), Map.entry("RO", 5), Map.entry("RR", 5), Map.entry("SC", 2),
            Map.entry("SP", 1), Map.entry("SE", 4), Map.entry("TO", 5)
    );

    private static final Set<String> CAPITAL_PREFIXES = Set.of(
            "010", "011", "012", "013", "014", "015", "020", "021", "022", "023",
            "200", "201", "202", "203", "220", "221", "222", "224",
            "300", "301", "302", "303", "700", "701", "702", "703",
            "800", "801", "802", "803", "900", "901", "902", "903",
            "400", "401", "402", "403", "500", "501", "502", "503",
            "600", "601", "602", "603"
    );

    private final AtelieProperties atelieProperties;

    private volatile String cachedOriginCep;
    private volatile String cachedOriginUf;

    public ShippingQuoteResponse quote(ShippingQuoteRequest request) {
        String destinationCep = onlyDigits(request.getDestinationCep());
        if (destinationCep.length() != 8) {
            throw new BusinessException("CEP de destino inválido. Informe 8 dígitos.", HttpStatus.BAD_REQUEST);
        }

        String originCep = onlyDigits(atelieProperties.getShipping().getOriginCep());
        if (originCep.length() != 8) {
            throw new BusinessException(
                    "CEP de origem da loja não configurado. Defina SHIPPING_ORIGIN_CEP no .env.",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }

        int totalQty = request.getItems().stream()
                .mapToInt(ShippingQuoteRequest.QuoteItem::getQuantity)
                .sum();
        if (totalQty <= 0) {
            throw new BusinessException("Informe ao menos um item para cotar o frete.", HttpStatus.BAD_REQUEST);
        }

        BigDecimal weightKg = estimateWeightKg(totalQty);

        List<ShippingQuoteResponse.ShippingOption> options = List.of();
        if (atelieProperties.getShipping().isTryLegacyApi()) {
            options = quoteFromCorreios(originCep, destinationCep, weightKg);
        }

        if (options.isEmpty()) {
            String originUf = resolveOriginUf(originCep);
            String destinationUf = resolveUf(destinationCep);
            options = estimateByUf(originCep, originUf, destinationCep, destinationUf, weightKg);
        }

        List<ShippingQuoteResponse.ShippingOption> sorted = options.stream()
                .sorted(Comparator.comparing(ShippingQuoteResponse.ShippingOption::getPrice))
                .toList();

        return ShippingQuoteResponse.builder()
                .originCep(formatCep(originCep))
                .destinationCep(formatCep(destinationCep))
                .packageWeightKg(weightKg)
                .options(sorted)
                .build();
    }

    public ShippingQuoteResponse.ShippingOption quoteSelected(
            String destinationCep,
            int totalQuantity,
            String serviceCode) {
        ShippingQuoteRequest request = new ShippingQuoteRequest();
        request.setDestinationCep(destinationCep);
        ShippingQuoteRequest.QuoteItem item = new ShippingQuoteRequest.QuoteItem();
        item.setProductId(0L);
        item.setQuantity(Math.max(totalQuantity, 1));
        request.setItems(List.of(item));

        ShippingQuoteResponse response = quote(request);
        return response.getOptions().stream()
                .filter(o -> o.getServiceCode().equals(serviceCode))
                .findFirst()
                .orElseThrow(() -> new BusinessException(
                        "Opção de frete inválida ou indisponível. Simule o frete novamente.",
                        HttpStatus.BAD_REQUEST));
    }

    private List<ShippingQuoteResponse.ShippingOption> quoteFromCorreios(
            String originCep,
            String destinationCep,
            BigDecimal weightKg) {
        try {
            String services = String.join(",", SERVICE_NAMES.keySet());
            String url = UriComponentsBuilder
                    .fromHttpUrl("http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx")
                    .queryParam("nCdEmpresa", "")
                    .queryParam("sDsSenha", "")
                    .queryParam("sCepOrigem", originCep)
                    .queryParam("sCepDestino", destinationCep)
                    .queryParam("nVlPeso", weightKg.setScale(2, RoundingMode.HALF_UP).toPlainString().replace('.', ','))
                    .queryParam("nCdFormato", 1)
                    .queryParam("nVlComprimento", atelieProperties.getShipping().getPackageLengthCm())
                    .queryParam("nVlAltura", atelieProperties.getShipping().getPackageHeightCm())
                    .queryParam("nVlLargura", atelieProperties.getShipping().getPackageWidthCm())
                    .queryParam("nVlDiametro", 0)
                    .queryParam("sCdMaoPropria", "N")
                    .queryParam("nVlValorDeclarado", 0)
                    .queryParam("sCdAvisoRecebimento", "N")
                    .queryParam("nCdServico", services)
                    .queryParam("StrRetorno", "xml")
                    .queryParam("nIndicaCalculo", 3)
                    .build(true)
                    .toUriString();

            // Timeout curto: a WS legada quase sempre falha; não atrasa o checkout.
            int timeout = Math.min(atelieProperties.getShipping().getTimeoutMs(), 2500);
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(timeout);
            factory.setReadTimeout(timeout);

            byte[] body = RestClient.builder()
                    .requestFactory(factory)
                    .build()
                    .get()
                    .uri(url)
                    .retrieve()
                    .body(byte[].class);

            if (body == null || body.length == 0) {
                return List.of();
            }

            String xml = new String(body, Charset.forName("ISO-8859-1"));
            return parseCorreiosXml(xml);
        } catch (Exception ex) {
            log.debug("API legada Correios indisponível ({}) — usando tabela regional", ex.getMessage());
            return List.of();
        }
    }

    private List<ShippingQuoteResponse.ShippingOption> parseCorreiosXml(String xml) throws Exception {
        Document doc = DocumentBuilderFactory.newInstance()
                .newDocumentBuilder()
                .parse(new ByteArrayInputStream(xml.getBytes(Charset.forName("ISO-8859-1"))));
        doc.getDocumentElement().normalize();

        NodeList services = doc.getElementsByTagName("cServico");
        Map<String, ShippingQuoteResponse.ShippingOption> byCode = new LinkedHashMap<>();

        for (int i = 0; i < services.getLength(); i++) {
            Element el = (Element) services.item(i);
            String code = text(el, "Codigo");
            String erro = text(el, "Erro");
            if (code == null || code.isBlank()) continue;
            if (erro != null && !erro.isBlank() && !"0".equals(erro)) {
                continue;
            }

            BigDecimal price = parseBrl(text(el, "Valor"));
            Integer deadline = parseInt(text(el, "PrazoEntrega"));
            if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) continue;

            String name = SERVICE_NAMES.getOrDefault(code, "Correios " + code);
            byCode.put(code, ShippingQuoteResponse.ShippingOption.builder()
                    .serviceCode(code)
                    .serviceName(name)
                    .price(price)
                    .deadlineDays(deadline != null ? deadline : 0)
                    .fromCorreios(true)
                    .build());
        }
        return new ArrayList<>(byCode.values());
    }

    /**
     * Tabela regional alinhada a faixas típicas de PAC/SEDEX no balcão,
     * usando distância entre UFs + capital vs interior.
     */
    private List<ShippingQuoteResponse.ShippingOption> estimateByUf(
            String originCep,
            String originUf,
            String destinationCep,
            String destinationUf,
            BigDecimal weightKg) {
        int originRegion = UF_REGION.getOrDefault(originUf, regionFromCepDigit(originCep));
        int destRegion = UF_REGION.getOrDefault(destinationUf, regionFromCepDigit(destinationCep));
        int distance = Math.abs(originRegion - destRegion);

        boolean sameUf = originUf != null && originUf.equalsIgnoreCase(destinationUf);
        boolean sameMetro = sameUf
                && CAPITAL_PREFIXES.contains(originCep.substring(0, 3))
                && CAPITAL_PREFIXES.contains(destinationCep.substring(0, 3));

        int band;
        if (sameMetro) {
            band = 0;
        } else if (sameUf) {
            band = 1;
        } else {
            band = 2 + Math.min(distance, 4);
        }

        BigDecimal weightFactor = weightKg.max(BigDecimal.valueOf(0.3));

        BigDecimal pac = BigDecimal.valueOf(16.90)
                .add(BigDecimal.valueOf(5.40).multiply(BigDecimal.valueOf(band)))
                .add(weightFactor.multiply(BigDecimal.valueOf(3.50)))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal sedex = BigDecimal.valueOf(24.90)
                .add(BigDecimal.valueOf(8.20).multiply(BigDecimal.valueOf(band)))
                .add(weightFactor.multiply(BigDecimal.valueOf(5.10)))
                .setScale(2, RoundingMode.HALF_UP);

        int pacDays = switch (band) {
            case 0 -> 3;
            case 1 -> 5;
            case 2 -> 7;
            case 3 -> 9;
            case 4 -> 11;
            default -> 13;
        };
        int sedexDays = switch (band) {
            case 0 -> 1;
            case 1 -> 2;
            case 2 -> 3;
            case 3 -> 4;
            default -> 5;
        };

        return List.of(
                ShippingQuoteResponse.ShippingOption.builder()
                        .serviceCode(PAC_CODE)
                        .serviceName("PAC")
                        .price(pac)
                        .deadlineDays(pacDays)
                        .fromCorreios(false)
                        .build(),
                ShippingQuoteResponse.ShippingOption.builder()
                        .serviceCode(SEDEX_CODE)
                        .serviceName("SEDEX")
                        .price(sedex)
                        .deadlineDays(sedexDays)
                        .fromCorreios(false)
                        .build()
        );
    }

    private String resolveOriginUf(String originCep) {
        if (originCep.equals(cachedOriginCep) && cachedOriginUf != null) {
            return cachedOriginUf;
        }
        String uf = resolveUf(originCep);
        cachedOriginCep = originCep;
        cachedOriginUf = uf;
        return uf;
    }

    private String resolveUf(String cep) {
        try {
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(2500);
            factory.setReadTimeout(2500);

            Map<String, Object> body = RestClient.builder()
                    .requestFactory(factory)
                    .build()
                    .get()
                    .uri("https://viacep.com.br/ws/{cep}/json/", cep)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});

            if (body != null && body.get("erro") == null && body.get("uf") != null) {
                return body.get("uf").toString().toUpperCase(Locale.ROOT);
            }
        } catch (Exception ex) {
            log.debug("ViaCEP indisponível para {}: {}", cep, ex.getMessage());
        }
        return ufFromCepDigit(cep);
    }

    private static int regionFromCepDigit(String cep) {
        int digit = Integer.parseInt(cep.substring(0, 1));
        return switch (digit) {
            case 0, 1 -> 1;
            case 2 -> 2;
            case 3 -> 2;
            case 4 -> 2;
            case 5 -> 3;
            case 6, 7 -> 4;
            case 8 -> 5;
            case 9 -> 3;
            default -> 3;
        };
    }

    private static String ufFromCepDigit(String cep) {
        int digit = Integer.parseInt(cep.substring(0, 1));
        return switch (digit) {
            case 0, 1 -> "SP";
            case 2 -> "RJ";
            case 3 -> "MG";
            case 4 -> "PR";
            case 5 -> "RS";
            case 6, 7 -> "BA";
            case 8 -> "AM";
            case 9 -> "GO";
            default -> "SP";
        };
    }

    private BigDecimal estimateWeightKg(int totalQuantity) {
        BigDecimal perPiece = BigDecimal.valueOf(atelieProperties.getShipping().getWeightPerItemKg());
        BigDecimal packing = BigDecimal.valueOf(0.15);
        BigDecimal weight = perPiece.multiply(BigDecimal.valueOf(totalQuantity)).add(packing);
        BigDecimal min = BigDecimal.valueOf(0.3);
        BigDecimal max = BigDecimal.valueOf(atelieProperties.getShipping().getMaxWeightKg());
        if (weight.compareTo(min) < 0) weight = min;
        if (weight.compareTo(max) > 0) weight = max;
        return weight.setScale(2, RoundingMode.HALF_UP);
    }

    private static String onlyDigits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private static String formatCep(String digits) {
        if (digits == null || digits.length() != 8) return digits;
        return digits.substring(0, 5) + "-" + digits.substring(5);
    }

    private static String text(Element parent, String tag) {
        NodeList list = parent.getElementsByTagName(tag);
        if (list.getLength() == 0 || list.item(0) == null) return null;
        return list.item(0).getTextContent() != null ? list.item(0).getTextContent().trim() : null;
    }

    private static BigDecimal parseBrl(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String normalized = raw.trim().replace(".", "").replace(",", ".");
        try {
            return new BigDecimal(normalized).setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static Integer parseInt(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
