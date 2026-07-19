package com.ateliegg.service;

import com.ateliegg.domain.entity.Stock;
import com.ateliegg.dto.dashboard.DashboardResponse;
import com.ateliegg.repository.OrderRepository;
import com.ateliegg.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MM/yyyy");

    private final OrderRepository orderRepository;
    private final StockRepository stockRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(LocalDate startDate, LocalDate endDate) {
        LocalDateTime rangeStart = startDate.atStartOfDay();
        LocalDateTime rangeEnd = endDate.plusDays(1).atStartOfDay();

        BigDecimal revenue = orderRepository.calculateTotalRevenueBetween(rangeStart, rangeEnd);
        long orderCount = orderRepository.countPaidOrdersBetween(rangeStart, rangeEnd);

        List<DashboardResponse.TopProduct> topProducts = orderRepository
                .findTopSellingProductsBetween(rangeStart, rangeEnd, PageRequest.of(0, 10))
                .stream()
                .map(row -> DashboardResponse.TopProduct.builder()
                        .productTitle((String) row[0])
                        .totalQuantity(((Number) row[1]).longValue())
                        .build())
                .toList();

        List<DashboardResponse.TopCategory> topCategories = orderRepository
                .findTopCategoriesBetween(rangeStart, rangeEnd, PageRequest.of(0, 10))
                .stream()
                .map(row -> DashboardResponse.TopCategory.builder()
                        .categoryName((String) row[0])
                        .totalQuantity(((Number) row[1]).longValue())
                        .build())
                .toList();

        List<DashboardResponse.TopBuyer> topBuyers = orderRepository
                .findTopBuyersBetween(rangeStart, rangeEnd, PageRequest.of(0, 10))
                .stream()
                .map(row -> DashboardResponse.TopBuyer.builder()
                        .customerName((String) row[0])
                        .orderCount(((Number) row[1]).longValue())
                        .totalSpent((BigDecimal) row[2])
                        .build())
                .toList();

        List<DashboardResponse.OutOfStockItem> outOfStock = stockRepository.findOutOfStockItems()
                .stream()
                .map(this::toOutOfStock)
                .toList();

        List<DashboardResponse.RecentSale> recentSales = orderRepository
                .findRecentSalesBetween(rangeStart, rangeEnd, PageRequest.of(0, 10))
                .stream()
                .map(o -> DashboardResponse.RecentSale.builder()
                        .orderNumber(o.getOrderNumber())
                        .customerName(o.getUser() != null ? o.getUser().getName() : o.getGuestName())
                        .total(o.getTotal())
                        .createdAt(o.getCreatedAt())
                        .build())
                .toList();

        List<DashboardResponse.MonthlyRevenue> monthlyRevenue = buildLast12MonthsRevenue();

        return DashboardResponse.builder()
                .revenue(revenue != null ? revenue : BigDecimal.ZERO)
                .orderCount(orderCount)
                .monthlyRevenue(monthlyRevenue)
                .topSellingProducts(topProducts)
                .topCategories(topCategories)
                .topBuyers(topBuyers)
                .outOfStockProducts(outOfStock)
                .recentSales(recentSales)
                .build();
    }

    private List<DashboardResponse.MonthlyRevenue> buildLast12MonthsRevenue() {
        YearMonth current = YearMonth.now();
        YearMonth start = current.minusMonths(11);
        LocalDateTime queryStart = start.atDay(1).atStartOfDay();

        Map<String, BigDecimal> revenueByMonth = new LinkedHashMap<>();
        for (int i = 0; i < 12; i++) {
            YearMonth month = start.plusMonths(i);
            revenueByMonth.put(month.format(MONTH_LABEL), BigDecimal.ZERO);
        }

        for (Object[] row : orderRepository.findMonthlyRevenueSince(queryStart)) {
            String dbMonth = (String) row[0];
            YearMonth ym = YearMonth.parse(dbMonth);
            String label = ym.format(MONTH_LABEL);
            if (revenueByMonth.containsKey(label)) {
                revenueByMonth.put(label, toBigDecimal(row[1]));
            }
        }

        List<DashboardResponse.MonthlyRevenue> result = new ArrayList<>();
        revenueByMonth.forEach((month, value) -> result.add(
                DashboardResponse.MonthlyRevenue.builder()
                        .month(month)
                        .revenue(value)
                        .build()
        ));
        return result;
    }

    private DashboardResponse.OutOfStockItem toOutOfStock(Stock stock) {
        return DashboardResponse.OutOfStockItem.builder()
                .productId(stock.getProduct().getId())
                .productTitle(stock.getProduct().getTitle())
                .colorName(stock.getColor().getName())
                .sizeName(stock.getSize().getName())
                .build();
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        return new BigDecimal(value.toString());
    }
}
