// admin/js/admin-notify.js
//
// Replaces browser-native alert()/confirm() with an in-page,
// centered notification system that matches the admin theme.
//
// Usage:
//   import { notify } from "./admin-notify.js";
//   notify.error("Something went wrong.");
//   notify.success("Saved.", { title: "Projects" });
//   if (await notify.confirm("Delete permanently?")) { ... }

const STYLE_ID = "admin-notify-styles";
const DEFAULT_TIMEOUT = 6000;

let layer = null;

// ==========================================
// STYLES (injected once)
// ==========================================

function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        .admin-notify-layer {
            position: fixed;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 1.5rem;
            pointer-events: none;
            z-index: 9999;
            overflow-y: auto;
        }

        .admin-notify {
            pointer-events: auto;
            width: 100%;
            max-width: 440px;
            display: flex;
            align-items: flex-start;
            gap: 0.9rem;
            padding: 1.1rem 1.25rem;
            background: var(--card, #faf7f0);
            color: var(--charcoal, #171717);
            border: 1px solid var(--border, #ded2c0);
            border-left: 4px solid var(--copper, #b87847);
            box-shadow: 0 18px 50px rgba(23, 23, 23, 0.18);
            font-family: inherit;
            font-size: 0.95rem;
            line-height: 1.5;
            animation: admin-notify-in 220ms cubic-bezier(0.2, 0, 0.2, 1) both;
        }

        .admin-notify--leaving {
            animation: admin-notify-out 180ms cubic-bezier(0.2, 0, 0.2, 1) both;
        }

        .admin-notify__icon {
            flex-shrink: 0;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.8rem;
            color: #ffffff;
            margin-top: 1px;
            background: var(--copper, #b87847);
        }

        .admin-notify__body {
            flex: 1;
            min-width: 0;
        }

        .admin-notify__title {
            margin: 0 0 0.2rem;
            font-weight: 700;
            font-size: 0.95rem;
        }

        .admin-notify__message {
            margin: 0;
            color: var(--muted, #765e4b);
            overflow-wrap: anywhere;
        }

        .admin-notify__close {
            align-self: flex-start;
            margin: -0.15rem -0.35rem 0 0;
            padding: 0.15rem 0.35rem;
            border: 0;
            background: transparent;
            color: var(--muted, #765e4b);
            font-size: 1.2rem;
            line-height: 1;
            cursor: pointer;
        }

        .admin-notify__close:hover {
            color: var(--charcoal, #171717);
        }

        .admin-notify--error   { border-left-color: var(--danger,  #8a3f35); }
        .admin-notify--error   .admin-notify__icon { background: var(--danger,  #8a3f35); }

        .admin-notify--success { border-left-color: var(--success, #3d6b4f); }
        .admin-notify--success .admin-notify__icon { background: var(--success, #3d6b4f); }

        .admin-notify--warning { border-left-color: var(--warning, #9b6a28); }
        .admin-notify--warning .admin-notify__icon { background: var(--warning, #9b6a28); }

        .admin-notify--info    { border-left-color: var(--copper,  #b87847); }
        .admin-notify--info    .admin-notify__icon { background: var(--copper,  #b87847); }

        /* ---------- Confirm dialog ---------- */

        .admin-confirm-backdrop {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            background: rgba(23, 23, 23, 0.55);
            animation: admin-notify-fade 180ms ease both;
        }

        .admin-confirm {
            width: 100%;
            max-width: 440px;
            padding: 1.75rem;
            background: var(--card, #faf7f0);
            color: var(--charcoal, #171717);
            border: 1px solid var(--border, #ded2c0);
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
            font-family: inherit;
            animation: admin-notify-in 220ms cubic-bezier(0.2, 0, 0.2, 1) both;
        }

        .admin-confirm__title {
            margin: 0 0 0.75rem;
            font-size: 1.15rem;
        }

        .admin-confirm__message {
            margin: 0 0 1.5rem;
            color: var(--muted, #765e4b);
            line-height: 1.6;
        }

        .admin-confirm__actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            flex-wrap: wrap;
        }

        .admin-confirm__btn {
            min-width: 100px;
            padding: 0.7rem 1.2rem;
            border: 1px solid var(--border, #ded2c0);
            background: transparent;
            color: inherit;
            font: inherit;
            font-weight: 600;
            cursor: pointer;
        }

        .admin-confirm__btn:hover {
            background: rgba(0, 0, 0, 0.04);
        }

        .admin-confirm__btn--danger {
            background: var(--danger, #8a3f35);
            color: #ffffff;
            border-color: var(--danger, #8a3f35);
        }

        .admin-confirm__btn--danger:hover {
            background: var(--danger, #8a3f35);
            filter: brightness(1.1);
        }

        .admin-confirm__btn--primary {
            background: var(--charcoal, #171717);
            color: #ffffff;
            border-color: var(--charcoal, #171717);
        }

        .admin-confirm__btn--primary:hover {
            background: #2b2b2b;
        }

        @keyframes admin-notify-in {
            from { opacity: 0; transform: translateY(12px) scale(0.98); }
            to   { opacity: 1; transform: none; }
        }

        @keyframes admin-notify-out {
            from { opacity: 1; transform: none; }
            to   { opacity: 0; transform: translateY(-8px) scale(0.98); }
        }

        @keyframes admin-notify-fade {
            from { opacity: 0; }
            to   { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
            .admin-notify,
            .admin-confirm,
            .admin-confirm-backdrop {
                animation-duration: 0.01ms !important;
            }
        }
    `;

    document.head.appendChild(style);
}

function ensureLayer() {
    if (layer && document.body.contains(layer)) return layer;

    layer = document.createElement("div");
    layer.className = "admin-notify-layer";
    layer.setAttribute("role", "region");
    layer.setAttribute("aria-label", "Notifications");
    document.body.appendChild(layer);

    return layer;
}

// ==========================================
// TOAST (error / success / warning / info)
// ==========================================

const ICONS = {
    error: "!",
    success: "✓",
    warning: "!",
    info: "i"
};

function showToast(type, message, options = {}) {
    if (typeof document === "undefined") return () => {};

    injectStyles();

    const {
        title = "",
        duration = DEFAULT_TIMEOUT,
        dismissible = true
    } = options;

    const host = ensureLayer();

    const toast = document.createElement("div");
    toast.className = `admin-notify admin-notify--${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.setAttribute("aria-live", type === "error" ? "assertive" : "polite");

    const icon = document.createElement("span");
    icon.className = "admin-notify__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = ICONS[type] || "i";

    const body = document.createElement("div");
    body.className = "admin-notify__body";

    if (title) {
        const titleEl = document.createElement("p");
        titleEl.className = "admin-notify__title";
        titleEl.textContent = title;
        body.appendChild(titleEl);
    }

    const messageEl = document.createElement("p");
    messageEl.className = "admin-notify__message";
    messageEl.textContent = String(message ?? "");
    body.appendChild(messageEl);

    toast.append(icon, body);

    let closeButton = null;

    if (dismissible) {
        closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "admin-notify__close";
        closeButton.setAttribute("aria-label", "Dismiss notification");
        closeButton.textContent = "×";
        toast.appendChild(closeButton);
    }

    host.appendChild(toast);

    let timer = null;
    let removed = false;

    const remove = () => {
        if (removed) return;
        removed = true;

        if (timer) clearTimeout(timer);
        if (closeButton) closeButton.removeEventListener("click", remove);

        toast.classList.add("admin-notify--leaving");

        const finish = () => toast.remove();

        toast.addEventListener("animationend", finish, { once: true });
        // Safety net in case the animation never fires.
        setTimeout(finish, 400);
    };

    if (closeButton) {
        closeButton.addEventListener("click", remove);
    }

    if (duration > 0) {
        timer = setTimeout(remove, duration);

        toast.addEventListener("mouseenter", () => {
            if (timer) clearTimeout(timer);
            timer = null;
        });

        toast.addEventListener("mouseleave", () => {
            if (!removed) timer = setTimeout(remove, duration);
        });
    }

    return remove;
}

// ==========================================
// CONFIRM (promise-based, centered modal)
// ==========================================

function confirmDialog(message, options = {}) {
    injectStyles();

    const {
        title = "Are you sure?",
        confirmLabel = "Confirm",
        cancelLabel = "Cancel",
        variant = "danger" // "danger" | "primary"
    } = options;

    return new Promise((resolve) => {
        const previouslyFocused =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        const backdrop = document.createElement("div");
        backdrop.className = "admin-confirm-backdrop";
        backdrop.setAttribute("role", "dialog");
        backdrop.setAttribute("aria-modal", "true");

        const dialog = document.createElement("div");
        dialog.className = "admin-confirm";

        const titleEl = document.createElement("h2");
        titleEl.className = "admin-confirm__title";
        titleEl.textContent = title;

        const messageEl = document.createElement("p");
        messageEl.className = "admin-confirm__message";
        messageEl.textContent = String(message ?? "");

        const actions = document.createElement("div");
        actions.className = "admin-confirm__actions";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "admin-confirm__btn";
        cancelBtn.textContent = cancelLabel;

        const okBtn = document.createElement("button");
        okBtn.type = "button";
        okBtn.className = `admin-confirm__btn admin-confirm__btn--${variant}`;
        okBtn.textContent = confirmLabel;

        actions.append(cancelBtn, okBtn);
        dialog.append(titleEl, messageEl, actions);
        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);

        let settled = false;

        const cleanup = (result) => {
            if (settled) return;
            settled = true;

            document.removeEventListener("keydown", onKey, true);
            backdrop.remove();

            if (previouslyFocused && previouslyFocused.focus) {
                try { previouslyFocused.focus(); } catch (_) { /* noop */ }
            }

            resolve(result);
        };

        const onKey = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                cleanup(false);
            } else if (event.key === "Enter") {
                event.preventDefault();
                cleanup(true);
            }
        };

        cancelBtn.addEventListener("click", () => cleanup(false));
        okBtn.addEventListener("click", () => cleanup(true));

        backdrop.addEventListener("click", (event) => {
            if (event.target === backdrop) cleanup(false);
        });

        document.addEventListener("keydown", onKey, true);

        // Focus the primary action so Enter/Escape work immediately.
        setTimeout(() => okBtn.focus(), 0);
    });
}

// ==========================================
// PUBLIC API
// ==========================================

export const notify = {
    error:   (message, options) => showToast("error",   message, options),
    success: (message, options) => showToast("success", message, options),
    warning: (message, options) => showToast("warning", message, options),
    info:    (message, options) => showToast("info",    message, options),
    confirm: confirmDialog,

    dismissAll() {
        if (!layer) return;
        layer.querySelectorAll(".admin-notify").forEach((el) => el.remove());
    }
};

export default notify;