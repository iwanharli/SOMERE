import Swal, { SweetAlertOptions } from "sweetalert2";

// ── Tema dasar SORE ──────────────────────────────────────────────────────────
const base: SweetAlertOptions = {
  background:          "#13161f",
  color:               "#e2e4f0",
  confirmButtonColor:  "#C8960A",
  cancelButtonColor:   "#1a1d2e",
  buttonsStyling:      true,
  customClass: {
    popup:         "swal-sore-popup",
    title:         "swal-sore-title",
    htmlContainer: "swal-sore-html",
    confirmButton: "swal-sore-confirm",
    cancelButton:  "swal-sore-cancel",
    timerProgressBar: "swal-sore-progress",
  },
};

// ── Success (auto close 2.5 detik) ──────────────────────────────────────────
export function swSuccess(title: string, text?: string) {
  return Swal.fire({
    ...base,
    icon:              "success",
    iconColor:         "#22c55e",
    title,
    text,
    timer:             2500,
    timerProgressBar:  true,
    showConfirmButton: false,
  });
}

// ── Error (harus ditutup manual) ─────────────────────────────────────────────
export function swError(title: string, text?: string) {
  return Swal.fire({
    ...base,
    icon:             "error",
    iconColor:        "#ef4444",
    title,
    text,
    confirmButtonText: "Mengerti",
  });
}

// ── Error dengan HTML (untuk detail breakdown) ───────────────────────────────
export function swErrorHtml(title: string, html: string) {
  return Swal.fire({
    ...base,
    icon:             "error",
    iconColor:        "#ef4444",
    title,
    html,
    confirmButtonText: "Mengerti",
  });
}

// ── Warning (harus ditutup manual) ───────────────────────────────────────────
export function swWarning(title: string, text?: string) {
  return Swal.fire({
    ...base,
    icon:             "warning",
    iconColor:        "#eab308",
    title,
    text,
    confirmButtonText: "OK",
  });
}

// ── Info (auto close 3 detik) ────────────────────────────────────────────────
export function swInfo(title: string, text?: string) {
  return Swal.fire({
    ...base,
    icon:              "info",
    iconColor:         "#3b82f6",
    title,
    text,
    timer:             3000,
    timerProgressBar:  true,
    showConfirmButton: false,
  });
}

// ── Konfirmasi (yes/no) ──────────────────────────────────────────────────────
export function swConfirm(options: {
  title: string;
  text?: string;
  html?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}) {
  return Swal.fire({
    ...base,
    icon:               options.danger ? "warning" : "question",
    iconColor:          options.danger ? "#ef4444" : "#C8960A",
    title:              options.title,
    text:               options.text,
    html:               options.html,
    showCancelButton:   true,
    confirmButtonText:  options.confirmText ?? "Ya",
    cancelButtonText:   options.cancelText  ?? "Batal",
    confirmButtonColor: options.danger ? "#ef4444" : "#C8960A",
    reverseButtons:     true,
  });
}

// ── Toast kecil pojok kanan atas ─────────────────────────────────────────────
const Toast = Swal.mixin({
  ...base,
  toast:             true,
  position:          "top-end",
  showConfirmButton: false,
  timer:             3000,
  timerProgressBar:  true,
});

export function swToast(icon: "success" | "error" | "warning" | "info", title: string) {
  const iconColor = { success: "#22c55e", error: "#ef4444", warning: "#eab308", info: "#3b82f6" }[icon];
  return Toast.fire({ icon, iconColor, title });
}

// ── CSS inject untuk styling konsisten ──────────────────────────────────────
const style = document.createElement("style");
style.textContent = `
  .swal-sore-popup {
    border: 1px solid #252840 !important;
    border-radius: 12px !important;
    padding: 28px 24px !important;
    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif !important;
  }
  .swal-sore-title {
    font-size: 17px !important;
    font-weight: 600 !important;
    color: #e2e4f0 !important;
    margin-bottom: 6px !important;
  }
  .swal-sore-html {
    font-size: 13px !important;
    color: #8b8fa8 !important;
    line-height: 1.6 !important;
  }
  .swal-sore-confirm {
    font-size: 13px !important;
    font-weight: 600 !important;
    border-radius: 7px !important;
    padding: 9px 20px !important;
  }
  .swal-sore-cancel {
    font-size: 13px !important;
    font-weight: 500 !important;
    border-radius: 7px !important;
    padding: 9px 20px !important;
    border: 1px solid #2a2d3a !important;
    color: #8b8fa8 !important;
  }
  .swal-sore-cancel:hover {
    background: #1f2335 !important;
    color: #e2e4f0 !important;
  }
  .swal-sore-progress {
    background: #C8960A !important;
    opacity: 0.5 !important;
  }
  .swal2-popup.swal-sore-popup .swal2-icon {
    margin: 0 auto 16px !important;
    width: 56px !important;
    height: 56px !important;
  }
`;
document.head.appendChild(style);
