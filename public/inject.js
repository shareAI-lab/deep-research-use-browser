const loadingButtonContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="memfree-loader animate-spin"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;

(function () {
  // 确保 DOM 已完全加载
  const initializeExtension = () => {
    if (window._sidebarInjected) return;
    window._sidebarInjected = true;

    if (typeof Readability === "undefined" || typeof TurndownService === "undefined") {
      console.error("必要的依赖未加载");
      return;
    }
    if (!document.body) {
      console.error("DOM 未完全加载");
      return;
    }

    window.addEventListener("message", function (event) {
      if (event.data.type === "SIDEBAR_ACTION") {
        chrome.runtime.sendMessage({ action: "openSidebar" });
      }
    });

    window.openSuperBrainSidebar = function () {
      window.postMessage({ type: "SIDEBAR_ACTION" }, "*");
    };

    if (document.getElementById("send-url-button")) return;

    const button = document.createElement("button");
    button.id = "send-url-button";
    button.className = "flot-btn";

    button.disabled = false;

    const svgButtonContent = `

  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width: 50px; height: 50px;">
    <style type="text/css">
      .st0{fill:#1E8BCA;}
      .st1{fill:#FFFFFF;}
    </style>
    <path class="st0" d="M9.8,9.3c0,0-1.7-2.7,1.1-5.2c2.5-2.4,6.2-0.4,7,0.1C17.9,4.2,11.4,4.2,9.8,9.3z"/>
    <path class="st0" d="M18.5,11.5c-1.9,0-6.4,0.2-8-0.4c-1.7-0.7-2.6-2.2-2.6-3.9c0-1.6,0.8-3.1,2.2-4.3 C4.9,4,0.9,7.6,0.9,12.4c0,2.9,1.1,4.9,2.9,6.6H0.7c0,0,2,3.6,11.7,3.6h5.4c5.8,0,6-0.7,6-4.8C23.7,14.6,22.9,11.5,18.5,11.5z"/>
    <circle class="st1" cx="18.3" cy="17.7" r="1.3"/>
  </svg>
`;

    button.innerHTML = svgButtonContent;

    button.addEventListener("mousedown", function (e) {
      e.preventDefault();

      let startY = e.clientY - button.offsetTop;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);

      function onMouseMove(e) {
        let newTop = e.clientY - startY;

        newTop = Math.min(Math.max(0, newTop), window.innerHeight - button.offsetHeight);

        button.style.top = newTop + "px";
      }

      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }
    });

    button.onclick = function (e) {
      const floatingIcon = e.target.closest(".floating-icon");
      if (floatingIcon) {
        const originalContent = floatingIcon.innerHTML;
        floatingIcon.innerHTML = loadingButtonContent;

        processContent().finally(() => {
          setTimeout(() => {
            floatingIcon.innerHTML = originalContent;
          }, 2000);
        });
      } else {
        chrome.runtime.sendMessage({ action: "openSidebar" });
      }
    };

    document.body.appendChild(button);

    const alertContainer = document.createElement("div");
    alertContainer.id = "custom-alert-container";
    alertContainer.innerHTML = `
      <div id="custom-alert">
        <div id="custom-alert-content">
          <p id="custom-alert-message"></p>
          <button id="custom-alert-ok" style="background-color: rgb(99, 102, 241); color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(alertContainer);
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
    initializeExtension();
  } else {
    document.addEventListener("DOMContentLoaded", initializeExtension);
  }
})();
