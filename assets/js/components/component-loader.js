export const loadComponents = async (root = document) => {
  const mounts = [...root.querySelectorAll("[data-component-src]")];
  const cacheKey = "20260708-responsive";

  await Promise.all(
    mounts.map(async (mount) => {
      const source = mount.dataset.componentSrc;
      if (!source) {
        return;
      }

      const separator = source.includes("?") ? "&" : "?";
      const response = await fetch(`${source}${separator}v=${cacheKey}`);
      if (!response.ok) {
        throw new Error(`No se pudo cargar el componente: ${source}`);
      }

      mount.innerHTML = await response.text();
    })
  );
};
