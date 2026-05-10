document.querySelector("[data-nav-toggle]")?.addEventListener("click", () => {
  document.querySelector("[data-nav]")?.classList.toggle("open");
});

document.querySelectorAll("[data-open-modal]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector("[data-modal]")?.showModal());
});

document.querySelector("[data-activate]")?.addEventListener("click", () => {
  const input = document.querySelector("#memberCode");
  const message = document.querySelector("[data-message]");
  const code = input?.value.trim().toUpperCase();
  const level = code === "WINPK99SVIP" ? "SVIP" : code === "WINPK99VIP" ? "VIP" : "";
  if (!message) return;
  if (!level) {
    message.textContent = "激活码无效。正式上线请接入服务端会员系统。";
    return;
  }
  localStorage.setItem("winpk99_member_level", level.toLowerCase());
  message.textContent = level + " 已在当前浏览器激活。";
});
