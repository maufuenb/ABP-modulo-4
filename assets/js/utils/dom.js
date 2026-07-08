export const get = (selector, parent = document) => parent.querySelector(selector);

export const create = (tag, options = {}) => {
  const element = document.createElement(tag);
  const { className, text, html, dataset, attributes } = options;

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  if (html !== undefined) {
    element.innerHTML = html;
  }

  if (dataset) {
    Object.entries(dataset).forEach(([key, value]) => {
      element.dataset[key] = value;
    });
  }

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  return element;
};
