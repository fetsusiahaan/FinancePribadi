import { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe, updateMe } from "../services/user.service";
import { getUsdToIdrRate } from "../services/currency.service";
import { formatIDR } from "../utils/format";
import { useAuth } from "./AuthContext";

const CurrencyContext = createContext(null);

const formatUSD = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);

export function CurrencyProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Sama query key ["me"] dipakai ProfileChip & halaman Profile — cache dibagi,
  // tidak ada request GET /users/me dobel.
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: getMe, enabled: isAuthenticated });

  // "Real-time" = auto-refresh tiap 5 menit selama app terbuka, bukan tiap
  // render — kurs valuta tidak berubah per detik, dan API publik gratis
  // biasanya punya rate limit.
  const { data: rate, isLoading: rateLoading, isError: rateError } = useQuery({
    queryKey: ["exchange-rate", "USD-IDR"],
    queryFn: getUsdToIdrRate,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });

  const mutation = useMutation({
    mutationFn: (code) => updateMe({ preferred_currency: code }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  const currency = user?.preferred_currency || "IDR";

  function formatMoney(amountIdr) {
    // Kurs belum termuat/gagal dimuat — tampilkan IDR apa adanya sebagai
    // fallback aman, jangan tampilkan angka kosong atau salah konversi.
    if (currency !== "USD" || !rate) return formatIDR(amountIdr);
    return formatUSD(Number(amountIdr) / rate);
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        rate,
        rateLoading,
        rateError,
        setCurrency: (code) => mutation.mutate(code),
        settingCurrency: mutation.isPending,
        formatMoney,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
