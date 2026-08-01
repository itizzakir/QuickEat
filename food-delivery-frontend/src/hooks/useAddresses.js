import { useCallback, useEffect, useState } from "react";

import { addressApi, apiErrorMessage } from "../services/api";

/** Shared so the profile page and the checkout picker read the same list. */
export function useAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setAddresses(await addressApi.list());
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load your addresses"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { addresses, isLoading, error, refresh };
}
