let auth0Client = null;
let flatData = [];

const authConfig = {
    domain: "dev-4w7gzuvyminy3ghu.us.auth0.com",
    clientId: "XrFCHFygPOmSDVIatxmcZaaDkGIj67zF",
    authorizationParams: {
        redirect_uri: window.location.origin + "/datatable.html",
        audience: "https://skijalista-api",
        scope: "openid profile email"
    }
};

window.onload = async () => {
    auth0Client = await auth0.createAuth0Client(authConfig);

    if (window.location.search.includes("code=")) {
        await auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, "/datatable.html");
    }
    const isAuthenticated = await auth0Client.isAuthenticated();

    document.getElementById("loginLink").onclick = () => {
        auth0Client.loginWithRedirect();
    };

    document.getElementById("logoutLink").onclick = () => {
        auth0Client.logout({
            logoutParams: {
                returnTo: window.location.origin + "/datatable.html"
            }
        });
    };
    if (isAuthenticated) {
        document.getElementById("loginLink").style.display = "none";
        document.getElementById("profileLink").style.display = "inline";
        document.getElementById("refreshLink").style.display = "inline";
        document.getElementById("logoutLink").style.display = "inline";

        await fetchData();
    }
    
    document.getElementById("refreshLink").onclick = async () => {
        const token = await auth0Client.getTokenSilently();

        const res = await fetch("http://localhost:3000/refresh", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) {
            alert("Greška - niste prijavljeni");
        } else {
            alert("Preslike osvježene");
        }
    }; 
};


async function fetchData() {
    const token = await auth0Client.getTokenSilently();

    const res = await fetch("http://localhost:3000/skijalista", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await res.json();
    flatData = data.response;
    renderTable(flatData);
}

function renderTable(data) {
    const tbody = document.querySelector("#table tbody");
    tbody.innerHTML = "";
    data.forEach(row =>
        tbody.innerHTML += `
        <tr>
            <td>${row.Naziv}</td>
            <td>${row.Drzava}</td>
            <td>${row.Regija}</td>
            <td>${row.Visina_pocetna_m}</td>
            <td>${row.Visina_vrh_m}</td>
            <td>${row.Naziv_staze}</td>
            <td>${row.Duzina_staze_km}</td>
            <td>${row.Tezina_staze}</td>
        </tr>`
    );
}

document.getElementById("filterText").addEventListener("input", filter);
document.getElementById("filterField").addEventListener("change", filter);

function filter() {
    const text = document.getElementById("filterText").value.toLowerCase();
    const field = document.getElementById("filterField").value;

    const filtered = flatData.filter(r =>
        r[field].toString().toLowerCase().includes(text)
    );

    renderTable(filtered);
}

function downloadJSON() {
    const text = document.getElementById("filterText").value.toLowerCase();
    const field = document.getElementById("filterField").value;

    const filtered = flatData.filter(r =>
        r[field].toString().toLowerCase().includes(text)
    );

    const blob = new Blob([JSON.stringify(filtered, null, 2)], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "filtered.json";
    a.click();
}

function downloadCSV() {
    const text = document.getElementById("filterText").value.toLowerCase();
    const field = document.getElementById("filterField").value;

    const filtered = flatData.filter(r =>
        r[field].toString().toLowerCase().includes(text)
    );

    let csv = "Naziv,Drzava,Regija,Visina_pocetna_m,Visina_vrh_m,Naziv_staze,Duzina_staze_km,Tezina_staze\n";

    filtered.forEach(r => {
        csv += `${r.Naziv},${r.Drzava},${r.Regija},${r.Visina_pocetna_m},${r.Visina_vrh_m},${r.Naziv_staze},${r.Duzina_staze_km},${r.Tezina_staze}\n`;
    });

    const blob = new Blob([csv], {type: "text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "filtered.csv";
    a.click();
}