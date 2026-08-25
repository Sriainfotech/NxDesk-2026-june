// Extracts a human-readable error message from a failed axios request.
// Backend views on this project return errors in a few different shapes:
//   { "error": "..." }                     (most common)
//   { "message": "..." }
//   { "detail": "..." }                    (DRF default exception handler)
//   { "field_name": ["This field is required."] }   (DRF serializer errors)
// This normalizes all of them and falls back to `fallback` when nothing
// readable is present in the response.
export function getApiErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (!data) return fallback;
  if (typeof data === "string" && data.trim()) return data;

  if (typeof data.error === "string" && data.error.trim()) return data.error;
  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (typeof data.detail === "string" && data.detail.trim()) {
    return data.detail;
  }

  if (typeof data === "object") {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
      return firstValue[0];
    }
    if (typeof firstValue === "string" && firstValue.trim()) {
      return firstValue;
    }
  }

  return fallback;
}
