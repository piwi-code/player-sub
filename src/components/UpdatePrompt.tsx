import { useRegisterSW } from 'virtual:pwa-register/react';

/** Shows a banner when a new version has been deployed, or when the app is ready offline. */
export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="toast" role="status">
      <span>{needRefresh ? 'A new version is available.' : 'Ready to work offline.'}</span>
      {needRefresh && <button onClick={() => updateServiceWorker(true)}>Reload</button>}
      <button className="secondary" onClick={close}>
        Close
      </button>
    </div>
  );
}
