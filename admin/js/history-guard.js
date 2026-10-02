// admin/js/history-guard.js
//
// Traps browser Back/Forward navigation so the user cannot leave the
// admin area via the browser chrome. Any popstate is intercepted,
// the history position is immediately restored, and an optional
// callback is invoked so the caller can decide what to do (e.g.
// redirect to login if the session is gone).
//
// Note: this does NOT disable the browser buttons themselves — that
// is not possible from page JavaScript. It makes them functionally
// inert by re-pushing the current entry on every popstate.

let installed = false;
let onExitAttempt = null;

function handlePopState(event) {
    // Immediately restore the history position so the browser's
    // Back/Forward never actually lands anywhere else.
    history.pushState({ adminGuard: true }, "", location.href);

    if (typeof onExitAttempt === "function") {
        try {
            onExitAttempt(event);
        } catch (error) {
            console.error("history-guard: onExitAttempt threw:", error);
        }
    }
}

/**
 * Install the guard. Safe to call multiple times — subsequent calls
 * are no-ops.
 *
 * @param {Object}   [options]
 * @param {Function} [options.onExitAttempt]
 *        Called every time the user tries to navigate away using the
 *        browser buttons. Receives the PopStateEvent.
 * @param {boolean}  [options.seedDoubleEntry=true]
 *        When true, we push two identical entries on install. This
 *        guarantees there is always somewhere for Back to "go" so
 *        popstate fires reliably, even if the admin page is the very
 *        first entry in the tab's history.
 */
export function installHistoryGuard(options = {}) {
    if (installed) {
        // Allow the callback to be swapped on a re-install.
        if (typeof options.onExitAttempt === "function") {
            onExitAttempt = options.onExitAttempt;
        }
        return;
    }

    installed = true;
    onExitAttempt = options.onExitAttempt || null;

    const seedDoubleEntry = options.seedDoubleEntry !== false;

    // Overwrite the current entry with a marker, then (optionally)
    // push a duplicate. The duplicate is the "wall": Back hits it,
    // popstate fires, and we immediately re-push.
    history.replaceState({ adminGuard: true }, "", location.href);

    if (seedDoubleEntry) {
        history.pushState({ adminGuard: true }, "", location.href);
    }

    window.addEventListener("popstate", handlePopState);
}

/**
 * Remove the guard. Useful if you want to deliberately allow the
 * user to leave (e.g. right before a scripted redirect).
 */
export function uninstallHistoryGuard() {
    if (!installed) return;

    window.removeEventListener("popstate", handlePopState);
    installed = false;
    onExitAttempt = null;
}

/**
 * Replace the current history entry with the given URL and navigate.
 * Unlike location.href = ..., this does NOT create a new history
 * entry, so Back cannot return to the page you're leaving.
 *
 * @param {string} url
 */
export function replaceNavigate(url) {
    // Uninstall first so the redirect isn't blocked by our own trap.
    uninstallHistoryGuard();
    window.location.replace(url);
}