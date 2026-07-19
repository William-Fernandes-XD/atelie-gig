package com.ateliegg.dto.dashboard;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class DashboardResponse {
    private BigDecimal revenue;
    private long orderCount;
    private List<MonthlyRevenue> monthlyRevenue;
    private List<TopProduct> topSellingProducts;
    private List<TopCategory> topCategories;
    private List<TopBuyer> topBuyers;
    private List<OutOfStockItem> outOfStockProducts;
    private List<RecentSale> recentSales;

    @Data
    @Builder
    public static class MonthlyRevenue {
        private String month;
        private BigDecimal revenue;
    }

    @Data
    @Builder
    public static class TopProduct {
        private String productTitle;
        private Long totalQuantity;
    }

    @Data
    @Builder
    public static class TopCategory {
        private String categoryName;
        private Long totalQuantity;
    }

    @Data
    @Builder
    public static class TopBuyer {
        private String customerName;
        private Long orderCount;
        private BigDecimal totalSpent;
    }

    @Data
    @Builder
    public static class OutOfStockItem {
        private Long productId;
        private String productTitle;
        private String colorName;
        private String sizeName;
    }

    @Data
    @Builder
    public static class RecentSale {
        private String orderNumber;
        private String customerName;
        private BigDecimal total;
        private LocalDateTime createdAt;
    }
}
