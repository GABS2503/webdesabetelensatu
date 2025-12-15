const API = "https://backend-desa-production.up.railway.app/api";
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".card").forEach(card => {
  observer.observe(card);
});
/* ================= PROFIL DESA ================= */
fetch(`${API}/profil-desas`)
  .then(res => res.json())
  .then(res => {
    const profil = res.data[0];

    // sejarah rich text → HTML
    let sejarahHTML = "";
    profil.sejarah.forEach(item => {
      let text = "";
      item.children.forEach(c => text += c.text);
      sejarahHTML += `<p>${text}</p>`;
    });

    // batas wilayah → list
    const batasList = profil.batas
      .split("\n")
      .map(b => `<li>${b}</li>`)
      .join("");

    document.getElementById("profil-desa").innerHTML = `
      <div class="profil-visi">
        ${profil.visi}
      </div>

      <h3>Sejarah Desa</h3>
      <div class="profil-sejarah">
        ${sejarahHTML}
      </div>

      <div class="profil-info">
        <div class="profil-box">
          <strong>Luas Wilayah</strong>
          <p>${profil.luas}</p>
        </div>

        <div class="profil-box">
          <strong>Batas Wilayah</strong>
          <ul>${batasList}</ul>
        </div>
      </div>
    `;
});

/* ================= PENDUDUK ================= */
fetch(`${API}/penduduks`)
  .then(res => res.json())
  .then(res => {
    const container = document.getElementById("data-penduduk");
    container.innerHTML = "";

    if (!res.data || res.data.length === 0) {
      container.innerHTML = "<p>Data penduduk belum tersedia.</p>";
      return;
    }

    res.data.forEach(p => {
      container.innerHTML += `
        <div class="jaga">
          <h3>Jaga ${p.Jaga}</h3>
          <p>
            Kepala Keluarga:
            <span class="counter" data-count="${Number(p.KK)}">0</span>
          </p>
          <p>
            Jumlah Warga:
            <span class="counter" data-count="${Number(p.Warga)}">0</span>
          </p>
        </div>
      `;
    });

    runCounters(); // 🔥 jalankan animasi angka
  })
  .catch(err => console.error("Penduduk Error:", err));


function animateCounter(el, duration = 1200) {
  const target = +el.getAttribute("data-count");
  let start = 0;
  const increment = target / (duration / 16);

  function update() {
    start += increment;
    if (start < target) {
      el.textContent = Math.floor(start);
      requestAnimationFrame(update);
    } else {
      el.textContent = target.toLocaleString("id-ID");
    }
  }

  update();
}

/* Jalankan setelah data muncul */
function runCounters() {
  document.querySelectorAll(".counter").forEach(counter => {
    counter.textContent = "0";
    animateCounter(counter);
  });
}

/* ===== LOAD BIDANG DESA ===== */
fetch(`${API}/bidang-desas`)
  .then(res => res.json())
  .then(res => {
    const tabs = document.getElementById("tabs-bidang");
    const konten = document.getElementById("konten-bidang");

    tabs.innerHTML = "";
    konten.innerHTML = "";

    res.data.forEach((b, index) => {
      const id = `bidang-${b.nama_bidang}`;

      let isiHTML = "";
      b.deskripsi.forEach(block => {
        if (block.type === "paragraph") {
          let text = "";
          block.children.forEach(c => text += c.text);
          isiHTML += `<p>${text}</p>`;
        }

        if (block.type === "list") {
          isiHTML += "<ul>";
          block.children.forEach(li => {
            let text = "";
            li.children.forEach(c => text += c.text);
            isiHTML += `<li>${text}</li>`;
          });
          isiHTML += "</ul>";
        }
      });

      tabs.innerHTML += `
        <button onclick="openBidangTab('${id}')">
          ${b.nama_bidang.toUpperCase()}
        </button>
      `;

      konten.innerHTML += `
        <div id="${id}" class="tab-content bidang-tab">
          <h3>Bidang ${b.nama_bidang}</h3>
          ${isiHTML}
        </div>
      `;

      if (index === 0) {
        setTimeout(() => openBidangTab(id), 100);
      }
    });
  });

/* ===== TAB BIDANG ===== */
function openBidangTab(id) {
  document.querySelectorAll(".bidang-tab").forEach(tab => {
    tab.style.display = "none";
  });

  document.getElementById(id).style.display = "block";
}

/* ===== LOAD STRUKTUR DESA ===== */
fetch(`${API}/struktur-desas`)
  .then(res => res.json())
  .then(res => {
    if (!res.data || res.data.length === 0) return;

    const s = res.data[0];

    // BASE URL BACKEND (Railway)
    const BACKEND = "https://backend-desa-production.up.railway.app";

    // CEK GAMBAR
    let imgHtml = "";
    if (s.gambar_struktur && s.gambar_struktur.url) {
      const imgUrl = BACKEND + s.gambar_struktur.url;
      imgHtml = `<img src="${imgUrl}" alt="Struktur Desa">`;
    }

    document.getElementById("struktur-desa").innerHTML = `
      <h3>${s.judul}</h3>
      <div class="struktur-wrapper">
        ${imgHtml}
        <p>${s.keterangan || ""}</p>
      </div>
    `;
  })
  .catch(err => console.error("Struktur Desa Error:", err));

window.toggleStruktur = function () {
  const el = document.getElementById("struktur-desa");
  if (!el) return;

  if (el.style.display === "none" || el.style.display === "") {
    el.style.display = "block";
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    el.style.display = "none";
  }
};

/* ================= VIDEO PROFIL DESA ================= */
fetch(`${API}/video-profil-desas`)
  .then(res => res.json())
  .then(res => {
    if (!res.data || res.data.length === 0) return;

    const v = res.data[0];

    // Ambil video ID dari berbagai format URL
    function getYoutubeID(url) {
      const regExp =
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(regExp);
      return match ? match[1] : null;
    }

    const videoID = getYoutubeID(v.youtube_url);

    if (!videoID) {
      document.getElementById("video-container").innerHTML =
        "<p>Video tidak valid</p>";
      return;
    }

    document.getElementById("video-container").innerHTML = `
      <div class="video-wrapper">
        <iframe
          src="https://www.youtube.com/embed/${videoID}"
          frameborder="0"
          allowfullscreen>
        </iframe>
        <h3>${v.judul}</h3>
        ${v.deskripsi ? `<p>${v.deskripsi}</p>` : ""}
      </div>
    `;
  })
  .catch(err => console.error("Video Profil Error:", err));
