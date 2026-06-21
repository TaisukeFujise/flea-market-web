import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  Link,
  useLoaderData,
  useNavigate,
  useRouteLoaderData,
  useSearchParams,
} from "react-router-dom";
import type { Product, Paginated } from "../../utils/types";
import { apiFetch } from "../../utils/api";
import { useAuth } from "../../utils/hooks/useAuth";
import type { HomeLoaderData } from "./homeLoader";
import type { LayoutLoaderData } from "../../components/layout/layoutLoader";
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
  const { categories } = useRouteLoaderData('root') as LayoutLoaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pagination, dispatch] = useReducer(
    paginationReducer,
    loaderData,
    initPagination,
  );
  const hasMore = pagination.offset < pagination.total && !pagination.error;

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

  // Per-card like state (optimistic)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());

  const sentinelRef = useRef<HTMLDivElement>(null);
  const priceDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);
  const generationRef = useRef(0);
  const offsetRef = useRef(pagination.offset);
  useEffect(() => {
    offsetRef.current = pagination.offset;
  }, [pagination.offset]);

  const selectedCategory = searchParams.get("category_id") ?? "";
  const selectedSort = searchParams.get("sort") ?? "";

  const selectedParentId = useMemo(() => {
    const selectedParent = categories.find(
      (parent) =>
        parent.id === selectedCategory ||
        parent.children.some((child) => child.id === selectedCategory),
    );
    return selectedParent?.id ?? "";
  }, [categories, selectedCategory]);

  const visibleExpandedParents = useMemo(() => {
    if (!selectedParentId) return expandedParents;
    return new Set([...expandedParents, selectedParentId]);
  }, [expandedParents, selectedParentId]);

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

  useEffect(() => {
    return () => {
      if (priceDebounce.current) clearTimeout(priceDebounce.current);
    };
  }, []);

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
        if (next.size < 3) next.forEach((c) => n.append("condition", c));
        return n;
      });

      return next;
    });
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

  function handleLike(e: React.MouseEvent, product: Product) {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (likingIds.has(product.id)) return;

    const currentlyLiked = likedIds.has(product.id);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (currentlyLiked) next.delete(product.id);
      else next.add(product.id);
      return next;
    });
    setLikingIds((prev) => new Set(prev).add(product.id));

    apiFetch(`/api/products/${product.id}/likes`, {
      method: currentlyLiked ? "DELETE" : "POST",
    })
      .catch(() => {
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (currentlyLiked) next.add(product.id);
          else next.delete(product.id);
          return next;
        });
      })
      .finally(() => {
        setLikingIds((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
      });
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroHeading}>
            商品の状態を、
            <br />
            AIレポートで可視化する。
          </h1>
          <p className={styles.heroSub}>
            AIが商品の状態を自動検出。
            <br />
            出品者も購入者も、誰でも安心して取引できます。
          </p>
          <Link to="/listing" className={styles.heroCta}>
            出品してみる
          </Link>
        </div>
        <div className={styles.heroImage}>
          <img src="/HeroImage.png" alt="" />
        </div>
      </section>

      {/* Layout: filter + grid */}
      <div className={styles.layout}>
        {/* Filter panel */}
        <div className={styles.filterPanel}>
          <p className={styles.filterTitle}>絞り込み</p>

          <div className={styles.filterSection}>
            <p className={styles.filterSectionTitle}>カテゴリ</p>
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
              {categories.map((parent) => (
                <div key={parent.id} className={styles.categoryItem}>
                  <button
                    className={`${styles.chip} ${
                      selectedCategory === parent.id ||
                      parent.children.some((ch) => ch.id === selectedCategory)
                        ? styles.chipActive
                        : ""
                    }`}
                    onClick={() => toggleParent(parent.id)}
                    aria-expanded={visibleExpandedParents.has(parent.id)}
                  >
                    {parent.name}
                  </button>
                  {visibleExpandedParents.has(parent.id) &&
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

          <div className={styles.filterSection}>
            <p className={styles.filterSectionTitle}>状態</p>
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
        <div className={styles.gridWrapper}>
          {/* Section heading + sort (above grid, right of filter) */}
          <div className={styles.topBar}>
            <h2 className={styles.sectionHeading}>
              おすすめの商品
              <span className={styles.countBadge}>{pagination.total}件</span>
            </h2>
            <div className={styles.sortBar}>
              {[
                { value: "", label: "新着" },
                { value: "price_asc", label: "価格が安い" },
                { value: "price_desc", label: "価格が高い" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => updateFilter("sort", s.value)}
                  className={`${styles.sortChip} ${selectedSort === s.value ? styles.sortChipActive : ""}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.grid}>
            {pagination.items.map((product) => {
              const liked = likedIds.has(product.id);
              return (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className={styles.card}
                >
                  <div className={styles.imageWrap}>
                    <img
                      src={product.thumbnail_url}
                      alt={product.title}
                      className={styles.cardImage}
                    />
                    {product.damage_count !== undefined && (
                      <span className={styles.aiBadge}>AI確認済み</span>
                    )}
                    <button
                      className={`${styles.heartBtn} ${liked ? styles.heartBtnActive : ""}`}
                      onClick={(e) => handleLike(e, product)}
                      aria-label={liked ? "いいね解除" : "いいね"}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill={liked ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.cardTitle}>{product.title}</p>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardPrice}>
                        ¥{product.price.toLocaleString()}
                      </span>
                      <span
                        className={styles.condBadge}
                        data-condition={product.condition}
                      >
                        {CONDITION_LABEL[product.condition]}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
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
      </div>
    </div>
  );
}
