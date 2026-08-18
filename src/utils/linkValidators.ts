/**
 * Utility xác thực đường dẫn (Link Validators) cho các tài liệu nộp bài trong SEAL.
 * Đảm bảo 100% link nhập vào đúng định dạng và đúng nền tảng trước khi gửi lên API.
 */

export interface LinkValidationResult {
  isValid: boolean;
  errorMessage?: string;
  normalizedUrl?: string;
}

export type DeliverableType =
  | "github"
  | "deployed_url"
  | "slides"
  | "demo_video"
  | "figma"
  | "report"
  | "other";

/**
 * Kiểm tra xem một chuỗi có phải là URL hợp lệ không.
 */
export function isValidGenericUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    // Chặn localhost hoặc ip nội bộ trong production submission
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return false;
    }
    return parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

/**
 * Regex kiểm tra GitHub / GitLab Repository hợp lệ.
 * Cấu trúc: https://github.com/owner/repo hoặc https://gitlab.com/owner/repo
 */
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

  const isGitHub = GITHUB_REPO_REGEX.test(trimmed);
  const isGitLab = GITLAB_REPO_REGEX.test(trimmed);

  if (!isGitHub && !isGitLab) {
    return {
      isValid: false,
      errorMessage:
        "Đường dẫn Repo phải có dạng https://github.com/owner/repo hoặc https://gitlab.com/owner/repo và là Public Repository!",
    };
  }

  return { isValid: true, normalizedUrl: trimmed };
}

/**
 * Kiểm tra đường dẫn Slide thuyết trình.
 * Chấp nhận: Google Slides, Canva, SlideShare, OneDrive, link PDF trực tuyến, hoặc bất kỳ trang slide công khai hợp lệ nào.
 */
export function validateSlideUrl(url: string): LinkValidationResult {
  const trimmed = (url || "").trim();
  if (!trimmed) {
    return { isValid: false, errorMessage: "Vui lòng nhập đường dẫn Slide thuyết trình." };
  }

  if (!isValidGenericUrl(trimmed)) {
    return {
      isValid: false,
      errorMessage: "Đường dẫn Slide không hợp lệ. Phải bắt đầu bằng https://",
    };
  }

  // Chặn trường hợp thí sinh paste nhầm link GitHub vào ô Slide
  if (GITHUB_REPO_REGEX.test(trimmed) || GITLAB_REPO_REGEX.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: "Bạn đang nhập nhầm link GitHub vào ô Slide. Vui lòng nhập link Google Slides, Canva hoặc PDF!",
    };
  }

  return { isValid: true, normalizedUrl: trimmed };
}

/**
 * Kiểm tra đường dẫn Live Demo sản phẩm.
 */
export function validateDemoUrl(url: string): LinkValidationResult {
  const trimmed = (url || "").trim();
  if (!trimmed) {
    return { isValid: false, errorMessage: "Vui lòng nhập đường dẫn Live Demo sản phẩm." };
  }

  if (!isValidGenericUrl(trimmed)) {
    return {
      isValid: false,
      errorMessage: "Đường dẫn Live Demo phải là website online hợp lệ (bắt đầu bằng https:// hoặc http://).",
    };
  }

  return { isValid: true, normalizedUrl: trimmed };
}

/**
 * Kiểm tra Video Demo (YouTube, Loom, Google Drive, Vimeo).
 */
const VIDEO_REGEX =
  /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|loom\.com\/share\/|drive\.google\.com\/file\/|vimeo\.com\/)/i;

export function validateVideoUrl(url: string): LinkValidationResult {
  const trimmed = (url || "").trim();
  if (!trimmed) return { isValid: true }; // Tùy chọn

  if (!isValidGenericUrl(trimmed)) {
    return {
      isValid: false,
      errorMessage: "Đường dẫn Video không hợp lệ. Phải bắt đầu bằng https://",
    };
  }

  if (!VIDEO_REGEX.test(trimmed)) {
    return {
      isValid: false,
      errorMessage:
        "Video demo nên thuộc YouTube (youtube.com / youtu.be), Loom (loom.com/share) hoặc Google Drive.",
    };
  }

  return { isValid: true, normalizedUrl: trimmed };
}

/**
 * Kiểm tra link thiết kế Figma.
 */
const FIGMA_REGEX = /^https?:\/\/(www\.)?figma\.com\/(file|design|proto)\//i;

export function validateFigmaUrl(url: string): LinkValidationResult {
  const trimmed = (url || "").trim();
  if (!trimmed) return { isValid: true }; // Tùy chọn

  if (!isValidGenericUrl(trimmed)) {
    return {
      isValid: false,
      errorMessage: "Đường dẫn Figma không hợp lệ. Phải bắt đầu bằng https://",
    };
  }

  if (!FIGMA_REGEX.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: "Đường dẫn thiết kế phải là link Figma hợp lệ (https://figma.com/design/... hoặc figma.com/file/...)",
    };
  }

  return { isValid: true, normalizedUrl: trimmed };
}

/**
 * Hàm phân giải validator theo Deliverable Type.
 */
export function validateDeliverableByType(
  type: string,
  url: string,
  isRequired: boolean = false,
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
