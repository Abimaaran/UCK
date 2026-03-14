import { useState, useEffect } from 'react';

/**
 * A custom hook to manage state synchronized with localStorage.
 * 
 * @param {string} key The key to use in localStorage.
 * @param {any} initialValue The initial value to use if no value is found in localStorage.
 * @returns {[any, Function]} A stateful value and a function to update it.
 */
function useLocalStorage(key, initialValue) {
  // State to store our value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Dispatch a custom event so other instances of useLocalStorage in the same tab can update
      window.dispatchEvent(new CustomEvent('local-storage-update', { detail: { key, newValue: valueToStore } }));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    const handleCustomEvent = (e) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleCustomEvent);
    };
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
