import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteProduct, getProducts } from "../../services/productApi";
import { useAuthStore } from "../../store/authStore";
import type { Product } from "../../types/product";

function centsToDollarsInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
}

function primaryImage(product: Product): string | null {
  const primary = product.images.find((img) => img.isPrimary);
  return primary?.imageUrl ?? product.images[0]?.imageUrl ?? null;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    if (Array.isArray(data?.message)) return data.message.join(", ");
    return data?.message ?? fallback;
  }
  return fallback;
}

function Products() {
  const { admin } = useAuthStore();
  const isAdmin = admin?.role === "ADMIN";
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProducts = async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      setProducts(await getProducts());
    } catch (err) {
      setListError(extractErrorMessage(err, "Could not load products."));
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const goToEdit = (product: Product) => {
    navigate(`/admin/products/${product.id}/edit`, { state: { product } });
  };

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(`Delete "${product.name}"?`);
    if (!confirmed) return;

    setDeletingId(product.id);
    setListError(null);

    try {
      await deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setListError(extractErrorMessage(err, "Could not delete product."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="px-10 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[Space_Grotesk] text-2xl font-bold text-[#F4F3F1]">
            Products
          </h1>
          <p className="mt-1 text-[15px] text-[#9A99A6]">
            Manage your catalog.
            {!isAdmin && " Only admins can delete a product."}
          </p>
        </div>

        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 rounded-md bg-[#3A5CFF] px-4 py-2.5 text-sm font-medium text-[#F4F3F1] transition-transform active:scale-[0.98]"
        >
          <Plus size={16} strokeWidth={2} />
          Add product
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-[#22222C]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#1A1A22] text-[#9A99A6]">
            <tr>
              <th className="px-4 py-3 font-medium">Image</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoadingList && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[#5C5B66]">
                  Loading products...
                </td>
              </tr>
            )}

            {!isLoadingList && listError && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[#FF8A8A]">
                  {listError}
                </td>
              </tr>
            )}

            {!isLoadingList && !listError && products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[#5C5B66]">
                  No products yet.
                </td>
              </tr>
            )}

            {!isLoadingList &&
              !listError &&
              products.map((product) => {
                const thumb = primaryImage(product);

                return (
                  <tr
                    key={product.id}
                    className="border-t border-[#22222C] text-[#F4F3F1]"
                  >
                    <td className="px-4 py-3">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={product.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-[#22222C]" />
                      )}
                    </td>
                    <td className="px-4 py-3">{product.name}</td>
                    <td className="px-4 py-3 text-[#9A99A6]">{product.sku}</td>
                    <td className="px-4 py-3 text-[#9A99A6]">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      ${centsToDollarsInput(product.priceCents)}
                    </td>
                    <td className="px-4 py-3">{product.stock}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => goToEdit(product)}
                          className="rounded-md p-1.5 text-[#9A99A6] transition-colors hover:bg-[#22222C] hover:text-[#F4F3F1]"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil size={16} strokeWidth={1.75} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                            className="rounded-md p-1.5 text-[#9A99A6] transition-colors hover:bg-[#22222C] hover:text-[#FF8A8A] disabled:opacity-50"
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 size={16} strokeWidth={1.75} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Products;