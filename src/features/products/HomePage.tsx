import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Link, useLoaderData, useSearchParams } from "react-router-dom";
import type { Product, Paginated } from "../../utils/types";
import { apiFetch } from "../../utils/api";
import type { HomeLoaderData } from "./homeLoader";
import styles from "./HomePage.module.css";

const CONDITION_LABEL: Record<string, string> = {
  good: "ほぼ新品",
  fair: "目立つ傷少なめ",
  poor: "使用感あり",
};

const MAX_PRICE = 200000;

// ---- Pagination state ----

type PaginationState = {
  items: Product[];
  total: number;
  offset: number;
  loading: boolean;
  error: boolean;
};
type PaginationAction =
  | { type: "reset"; items: Product[]; total: number; offset: number }
  | { type: "fetch_start" }
  | { type: "fetch_done"; items: Product[]; total: number }
  | { type: "fetch_error" }
  | { type: "retry" };

function paginationReducer(
  state: PaginationState,
  action: PaginationAction,
): PaginationState {
  switch (action.type) {
    case "reset":
      return {
        items: action.items,
        total: action.total,
        offset: action.offset,
        loading: false,
        error: false,
      };
    case "fetch_start":
      return { ...state, loading: true, error: false };
    case "fetch_done":
      return {
        items: [...state.items, ...action.items],
        total: action.total,
        offset: state.offset + action.items.length,
        loading: false,
        error: false,
      };
    case "fetch_error":
      return { ...state, loading: false, error: true };
    case "retry":
      return { ...state, error: false };
  }
}

function initPagination(loaderData: HomeLoaderData): PaginationState {
  return {
    items: loaderData.items,
    total: loaderData.total,
    offset: loaderData.items.length,
    loading: false,
    error: false,
  };
}

// ---- Component ----

export default function HomePage() {
  const loaderData = useLoaderData() as HomeLoaderData;
  const [searchParams, setSearchParams] = useSearchParams();

  const [pagination, dispatch] = useReducer(
    paginationReducer,
    loaderData,
    initPagination,
  );
  // hasMore は派生値。エラー時はそれ以上取得しない
  const hasMore = pagination.offset < pagination.total && !pagination.error;

  // Filter UI state（URLに永続化しない純粋なUI状態）
  const [checkedConditions, setCheckedConditions] = useState<Set<string>>(
    () => {
      const fromUrl = searchParams.getAll("condition");
      return fromUrl.length > 0
        ? new Set(fromUrl)
        : new Set(["good", "fair", "poor"]);
    },
  );
  const [priceRange, setPriceRange] = useState({
    min: parseInt(searchParams.get("min_price") ?? "0"),
    max: parseInt(searchParams.get("max_price") ?? String(MAX_PRICE)),
  });
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    new Set(),
  );

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");

  const sentinelRef = useRef<HTMLDivElement>(null);
  const priceDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);
  const generationRef = useRef(0);
  const offsetRef = useRef(pagination.offset);
  useEffect(() => {
    offsetRef.current = pagination.offset;
  }, [pagination.offset]);

  const selectedCategory = searchParams.get("category_id") ?? "";
  const selectedSort = searchParams.get("sort") ?? "";

  // ローダーが再実行されたとき（フィルター変更後）にページネーションをリセット
  useEffect(() => {
    generationRef.current += 1;
    isFetchingRef.current = false;
    dispatch({
      type: "reset",
      items: loaderData.items,
      total: loaderData.total,
      offset: loaderData.items.length,
    });
  }, [loaderData]);

  const fetchMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    const gen = generationRef.current;
    dispatch({ type: "fetch_start" });
    try {
      const qs = new URLSearchParams(searchParams);
      qs.set("limit", "20");
      qs.set("offset", String(offsetRef.current));
      const result = await apiFetch<Paginated<Product>>(`/api/products?${qs}`);
      if (gen !== generationRef.current) return;
      dispatch({
        type: "fetch_done",
        items: result.items,
        total: result.total,
      });
    } catch {
      if (gen !== generationRef.current) return;
      dispatch({ type: "fetch_error" });
    } finally {
      isFetchingRef.current = false;
    }
  }, [hasMore, searchParams]);

  // 無限スクロール
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchMore();
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, fetchMore]);

  function updateFilter(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  }

  function handleConditionChange(condition: string, checked: boolean) {
    setCheckedConditions((prev) => {
      const next = new Set(prev);
      if (checked) next.add(condition);
      else next.delete(condition);

      setSearchParams((p) => {
        const n = new URLSearchParams(p);
        n.delete("condition");
        // 全選択（＝フィルターなし）のときはパラメータ不要
        if (next.size < 3) next.forEach((c) => n.append("condition", c));
        return n;
      });

      return next;
    });
  }

  useEffect(() => {
    return () => {
      if (priceDebounce.current) clearTimeout(priceDebounce.current);
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, []);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => updateFilter("q", value), 400);
  }

  const priceInvalid = priceRange.min > priceRange.max;

  function handlePriceChange(key: "min" | "max", value: number) {
    const next = { ...priceRange, [key]: value };
    setPriceRange(next);
    if (priceDebounce.current) clearTimeout(priceDebounce.current);
    priceDebounce.current = setTimeout(() => {
      if (next.min > next.max) {
        setSearchParams((prev) => {
          const n = new URLSearchParams(prev);
          n.delete("min_price");
          n.delete("max_price");
          return n;
        });
        return;
      }
      updateFilter("min_price", next.min > 0 ? String(next.min) : "");
      updateFilter(
        "max_price",
        next.max > 0 && next.max < MAX_PRICE ? String(next.max) : "",
      );
    }, 400);
  }

  function toggleParent(parentId: string) {
    setExpandedParents((prev) =>
      prev.has(parentId) ? new Set() : new Set([parentId]),
    );
  }

  function selectCategory(id: string) {
    updateFilter("category_id", selectedCategory === id ? "" : id);
  }

  return (
    <div className={styles.page}>
      <div className={styles.searchBar}>
        <input
          type="search"
          placeholder="キーワードで検索"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      <h2>おすすめの商品</h2>
      <p>{pagination.total}件</p>

      <div className={styles.sortBar}>
        {[
          { value: "", label: "新着" },
          { value: "price_asc", label: "価格が安い" },
          { value: "price_desc", label: "価格が高い" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => updateFilter("sort", s.value)}
            className={`${styles.chip} ${styles.sortChip} ${selectedSort === s.value ? styles.chipActive : ""}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        {/* Filter panel */}
        <div className={styles.filterPanel}>
          <strong>絞り込み</strong>

          {/* Category */}
          <div className={styles.filterSection}>
            <p>
              <strong>カテゴリ</strong>
            </p>
            <div className={styles.categoryList}>
              <button
                className={`${styles.chip} ${!selectedCategory ? styles.chipActive : ""}`}
                onClick={() => {
                  setExpandedParents(new Set());
                  updateFilter("category_id", "");
                }}
              >
                すべて
              </button>
              {loaderData.categories.map((parent) => (
                <div key={parent.id} className={styles.categoryItem}>
                  <button
                    className={`${styles.chip} ${
                      selectedCategory === parent.id ||
                      parent.children.some((ch) => ch.id === selectedCategory)
                        ? styles.chipActive
                        : ""
                    }`}
                    onClick={() => {
                      toggleParent(parent.id);
                      selectCategory(parent.id);
                    }}
                  >
                    {parent.name}
                  </button>
                  {expandedParents.has(parent.id) &&
                    parent.children.length > 0 && (
                      <div className={styles.childChips}>
                        {parent.children.map((child) => (
                          <button
                            key={child.id}
                            className={`${styles.chip} ${styles.chipSmall} ${selectedCategory === child.id ? styles.chipActive : ""}`}
                            onClick={() => selectCategory(child.id)}
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div className={styles.filterSection}>
            <p>
              <strong>状態</strong>
            </p>
            {(["good", "fair", "poor"] as const).map((c) => (
              <label key={c} className={styles.conditionLabel}>
                <input
                  type="checkbox"
                  checked={checkedConditions.has(c)}
                  onChange={(e) => handleConditionChange(c, e.target.checked)}
                />
                {CONDITION_LABEL[c]}
              </label>
            ))}
          </div>

          {/* Price */}
          <div className={styles.filterSection}>
            <div className={styles.priceRow}>
              <span>下限価格</span>
              <span>
                {priceRange.min > 0
                  ? `¥${priceRange.min.toLocaleString()}`
                  : "下限なし"}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_PRICE}
              step={1000}
              value={priceRange.min}
              onChange={(e) => handlePriceChange("min", Number(e.target.value))}
              className={styles.slider}
            />
            <div className={`${styles.priceRow} ${styles.priceRowUpper}`}>
              <span>上限価格</span>
              <span>
                {priceRange.max < MAX_PRICE
                  ? `¥${priceRange.max.toLocaleString()}`
                  : "上限なし"}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_PRICE}
              step={1000}
              value={priceRange.max}
              onChange={(e) => handlePriceChange("max", Number(e.target.value))}
              className={styles.slider}
            />
            {priceInvalid && (
              <p className={styles.priceError}>
                最小 &lt; 最大で入力してください
              </p>
            )}
          </div>
        </div>

        {/* Product grid */}
        <div className={styles.grid}>
          {pagination.items.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className={styles.card}
            >
              <img src={product.thumbnail_url} alt={product.title} />
              <div className={styles.cardBody}>
                <p>{product.title}</p>
                <div className={styles.cardFooter}>
                  <span>¥{product.price.toLocaleString()}</span>
                  <span>{CONDITION_LABEL[product.condition]}</span>
                </div>
                {product.damage_count !== undefined && (
                  <small>傷 {product.damage_count}件</small>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div ref={sentinelRef} className={styles.sentinel}>
        {pagination.loading && <span>読み込み中...</span>}
        {pagination.error && (
          <div className={styles.retryArea}>
            <span>読み込みに失敗しました</span>
            <button
              className={styles.retryButton}
              onClick={() => dispatch({ type: "retry" })}
            >
              再試行
            </button>
          </div>
        )}
        {!hasMore && !pagination.error && pagination.items.length > 0 && (
          <span>すべて表示しました</span>
        )}
      </div>
    </div>
  );
}
