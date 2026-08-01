package com.quickbite.food_delivery_backend.payload.response;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Stable pagination envelope.
 *
 * <p>Serialising Spring's {@code Page} directly is unstable across versions and leaks the
 * internal {@code Pageable} shape, so paged endpoints map into this instead.
 */
public class PageResponse<T> {

    private final List<T> content;
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;
    private final boolean first;
    private final boolean last;

    private PageResponse(Page<?> source, List<T> content) {
        this.content = content;
        this.page = source.getNumber();
        this.size = source.getSize();
        this.totalElements = source.getTotalElements();
        this.totalPages = source.getTotalPages();
        this.first = source.isFirst();
        this.last = source.isLast();
    }

    public static <S, T> PageResponse<T> of(Page<S> page, Function<S, T> mapper) {
        return new PageResponse<>(page,
                page.getContent().stream().map(mapper).collect(Collectors.toList()));
    }

    public List<T> getContent() { return content; }
    public int getPage() { return page; }
    public int getSize() { return size; }
    public long getTotalElements() { return totalElements; }
    public int getTotalPages() { return totalPages; }
    public boolean isFirst() { return first; }
    public boolean isLast() { return last; }
}
