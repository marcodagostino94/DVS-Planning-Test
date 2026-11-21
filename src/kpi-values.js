// Solo tipografia: conserva lo spazio dell'illustrazione al variare dei conteggi.
(() => {
  ['todayShiftCount', 'todayPeopleCount', 'todayRoomCount'].forEach(id => {
    const value = document.getElementById(id);
    if (!value) return;
    const fit = () => { value.dataset.digits = String(value.textContent.trim().length); };
    new MutationObserver(fit).observe(value, {childList:true, characterData:true, subtree:true});
    fit();
  });
})();
