export class StorageService {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  loadTasks() {
    const savedTasks = localStorage.getItem(this.storageKey);
    if (!savedTasks) {
      return [];
    }

    try {
      const parsed = JSON.parse(savedTasks);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("No se pudieron leer las tareas guardadas.", error);
      return [];
    }
  }

  saveTasks(tasks) {
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
  }

  getItem(key) {
    return localStorage.getItem(key);
  }

  setItem(key, value) {
    localStorage.setItem(key, value);
  }
}
