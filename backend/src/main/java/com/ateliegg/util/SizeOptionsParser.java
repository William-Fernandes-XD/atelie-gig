package com.ateliegg.util;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public final class SizeOptionsParser {

    private SizeOptionsParser() {}

    public static List<String> parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of("40-48");
        }
        List<String> parsed = Arrays.stream(raw.split("[,;]"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());
        return parsed.isEmpty() ? List.of("40-48") : parsed;
    }

    public static String join(List<String> options) {
        if (options == null || options.isEmpty()) {
            return "40-48";
        }
        return options.stream()
                .filter(s -> s != null && !s.isBlank())
                .map(String::trim)
                .distinct()
                .collect(Collectors.joining(", "));
    }
}
