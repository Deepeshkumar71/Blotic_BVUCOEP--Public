/**
 * Highlights matching text in a string based on search query
 * @param text - The full text to search within
 * @param query - The search query to highlight
 * @returns JSX with highlighted matches
 */
export const highlightText = (text: string, query: string): JSX.Element => {
  if (!query.trim()) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  
  return (
    <>
      {parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white font-semibold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
};
