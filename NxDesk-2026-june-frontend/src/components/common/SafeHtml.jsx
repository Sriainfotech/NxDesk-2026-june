import React from "react";
import DOMPurify from "dompurify";

/**
 * Renders backend-sourced HTML (ticket descriptions, history entries) with
 * DOMPurify sanitization first. Ticket descriptions come from a rich-text
 * editor and are stored/returned as raw HTML with no server-side
 * sanitization - rendering them directly via dangerouslySetInnerHTML was a
 * stored-XSS vector for every viewer of that ticket. Use this in place of
 * dangerouslySetInnerHTML wherever backend HTML needs to be rendered.
 */
const SafeHtml = ({ html, className = "", as: Component = "div", ...rest }) => {
  const clean = DOMPurify.sanitize(html || "");
  return <Component className={className} dangerouslySetInnerHTML={{ __html: clean }} {...rest} />;
};

export default SafeHtml;
