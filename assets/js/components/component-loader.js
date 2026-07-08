export const loadComponents = async (root = document) => {
  const mounts = [...root.querySelectorAll("[data-component-src]")];

  await Promise.all(
    mounts.map(async (mount) => {
      const source = mount.dataset.componentSrc;
      if (!source) {
        return;
      }

      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`No se pudo cargar el componente: ${source}`);
      }

      mount.innerHTML = await response.text();
    })
  );
};
