import DOMPurify from "dompurify";
import parse from "html-react-parser";

interface HTMLContentProps {
  readonly html: string;
  readonly allowedTags?: readonly string[];
  readonly allowedAttributes?: readonly string[];
}

export default function HTMLContent({ 
  html, 
  allowedTags = ["p", "ol", "ul", "li", "strong", "em", "img", "u", "span", "div"],
  allowedAttributes = ["src", "alt", "class", "style"]
}: HTMLContentProps) {
  const sanitizedHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags as string[],
    ALLOWED_ATTR: allowedAttributes as string[],
  });
  
  return <>{parse(sanitizedHTML)}</>;
} 