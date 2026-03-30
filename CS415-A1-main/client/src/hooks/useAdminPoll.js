/**
 * useAdminPoll — SRP: only responsible for polling admin monitoring data on an
 * interval. Exposes nothing about how data is rendered or stored.
 *
 * DIP: depends on the api abstraction, not concrete fetch calls.
 *
 * @param {object} options
 * @param {boolean}          options.enabled            - poll only when admin view is active
 * @param {Array}            options.accounts           - needed to resolve account number
 * @param {string|number}    options.selectedAccountForTx
 * @param {function}         options.onData             - called with refreshed data object
 * @param {function}         options.onError            - called with error message string
 * @param {number}           [options.intervalMs=10000]
 */
import { useEffect } from "react";
import { api } from "../api";

export function useAdminPoll({
  enabled,
  accounts,
  selectedAccountForTx,
  onData,
  onError,
  intervalMs = 10000,
}) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const refresh = async () => {
      const selected = accounts.find((a) => String(a.id) === String(selectedAccountForTx));
      const accountNumber = selectedAccountForTx ? (selected?.accountNumber || "") : "";
      try {
        const [txRows, loginLogRows, notificationLogRows, limit, report, statementReqRows] =
          await Promise.all([
            api.getAdminTransactions(accountNumber),
            api.getAdminLoginLogs(100),
            api.getNotificationLogsAdmin(100),
            api.getTransferLimitAdmin(),
            api.getAdminDashboardReport(),
            api.getAdminStatementRequests(),
          ]);

        if (!cancelled) {
          onData({ txRows, loginLogRows, notificationLogRows, limit, report, statementReqRows });
        }
      } catch (err) {
        if (!cancelled) {
          onError(err.message);
        }
      }
    };

    refresh();
    const timer = setInterval(refresh, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, selectedAccountForTx, accounts]);
}
