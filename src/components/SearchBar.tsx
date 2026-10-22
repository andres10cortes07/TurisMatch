
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ej. Museos gratuitos en Bogotá"
        aria-label="Buscar lugares turísticos"
      />

      <button type="submit" disabled={!query.trim()}>
        Buscar
      </button>
    </form>
  );
}

export default SearchBar;
