export interface LinkValidationResult {
  isValid: boolean;
  errorMessage?: string;
  normalizedUrl?: string;
}

export function isValidGenericUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return false;
    }
    return parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

const GITHUB_REPO_REGEX =
  /^https?:\/\/(www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(\/.*)?$/i;
const GITLAB_REPO_REGEX =
  /^https?:\/\/(www\.)?gitlab\.com\/([a-zA-Z0-9_.-]+(\/[a-zA-Z0-9_.-]+)+)(\/.*)?$/i;

export function validateRepoUrl(url: string): LinkValidationResult {
  const trimmed = (url || "").trim();
  if (!trimmed) {
    return { isValid: false, errorMessage: "Vui lòng nhập đường dẫn kho mã nguồn (Repo URL)." };
  }

  if (!isValidGenericUrl(trimmed)) {
    return {
      isValid: false,
      errorMessage: "Đường dẫn không hợp lệ. Phải bắt đầu bằng https://",
    };
  }

  if (!GITHUB_REPO_REGEX.test(trimmed) && !GITLAB_REPO_REGEX.test(trimmed)) {
    return {
      isValid: false,
      errorMessage:
        "Repo phải là https://github.com/owner/repo hoặc https://gitlab.com/owner/repo (public).",
    };
  }

  return { isValid: true, normalizedUrl: trimmed };
}

export function validateSlideUrl(url: string): LinkValidationResult {
  const trimmed = (url || "").trim();
  if (!trimmed) {
    return { isValid: false, errorMessage: "Vui lòng nhập đường dẫn slide thuyết trình." };
  }

  if (!isValidGenericUrl(trimmed)) {
    return {
      isValid: false,
      errorMessage: "Đường dẫn slide không hợp lệ. Phải bắt đầu bằng https://",
    };
  }

  if (GITHUB_REPO_REGEX.test(trimmed) || GITLAB_REPO_REGEX.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: "Ô slide đang chứa link GitHub/GitLab. Hãy nhập Google Slides, Canva hoặc PDF.",
    };
  }

  return { isValid: true, normalizedUrl: trimmed };
}

export function validateDemoUrl(url: string): LinkValidationResult {
  const trimmed = (url || "").trim();
  if (!trimmed) {
    return { isValid: false, errorMessage: "Vui lòng nhập đường dẫn live demo." };
  }

  if (!isValidGenericUrl(trimmed)) {
    return {
      isValid: false,
      errorMessage: "Live demo phải là website bắt đầu bằng https:// hoặc http://.",
    };
  }

  return { isValid: true, normalizedUrl: trimmed };
}

const VIDEO_REGEX =
  /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|loom\.com\/share\/|drive\.google\.com\/file\/|vimeo\.com\/)/i;

export function validateVideoUrl(url: string): LinkValidationResult {
  const trimmed = (url || "").trim();
  if (!trimmed) return { isValid: true };

  if (!isValidGenericUrl(trimmed)) {
    return {
      isValid: false,
      errorMessage: "Đường dẫn video không hợp lệ. Phải bắt đầu bằng https://",
    };
  }

  if (!VIDEO_REGEX.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: "Video demo nên thuộc YouTube, Loom, Vimeo hoặc Google Drive.",
    };
  }

  return { isValid: true, normalizedUrl: trimmed };
}

const FIGMA_REGEX = /^https?:\/\/(www\.)?figma\.com\/(file|design|proto)\//i;

export function validateFigmaUrl(url: string): LinkValidationResult {
  const trimmed = (url || "").trim();
  if (!trimmed) return { isValid: true };

  if (!isValidGenericUrl(trimmed)) {
    return {
      isValid: false,
      errorMessage: "Đường dẫn Figma không hợp lệ. Phải bắt đầu bằng https://",
    };
  }

  if (!FIGMA_REGEX.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: "Đường dẫn thiết kế phải là link Figma (figma.com/design hoặc figma.com/file).",
    };
  }

  return { isValid: true, normalizedUrl: trimmed };
}

export function validateDeliverableByType(
  type: string,
  url: string,
  isRequired = false,
): LinkValidationResult {
  const trimmed = (url || "").trim();
  if (!trimmed) {
    if (isRequired) {
      return { isValid: false, errorMessage: "Trường này là bắt buộc." };
    }
    return { isValid: true };
  }

  switch (type) {
    case "github":
      return validateRepoUrl(trimmed);
    case "slides":
      return validateSlideUrl(trimmed);
    case "deployed_url":
      return validateDemoUrl(trimmed);
    case "demo_video":
      return validateVideoUrl(trimmed);
    case "figma":
      return validateFigmaUrl(trimmed);
    default:
      if (!isValidGenericUrl(trimmed)) {
        return { isValid: false, errorMessage: "Đường dẫn phải bắt đầu bằng https://" };
      }
      return { isValid: true, normalizedUrl: trimmed };
  }
}
