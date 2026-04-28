const STORAGE = {
  user: "rf_user",
  resources: "rf_resources",
  requests: "rf_requests",
  history: "rf_history"
};

function getData(key, fallback = []) {
  return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
}

function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

function initApp() {
  const user = JSON.parse(localStorage.getItem(STORAGE.user) || "null");

  if (!user) {
    window.location.href = "index.html";
  }
}

function loginUser() {
  const name = document.getElementById("loginName").value.trim();
  const role = document.getElementById("loginRole").value;

  if (!name) {
    alert("Please enter your name");
    return;
  }

  localStorage.setItem(STORAGE.user, JSON.stringify({ name, role }));
  window.location.href = "dashboard.html";
}

function logoutUser() {
  localStorage.removeItem(STORAGE.user);
  window.location.href = "index.html";
}

function seedDemoData() {
  const resources = [
    {
      id: uid("res"),
      name: "Ambulance A1",
      type: "Ambulance",
      location: "Zone A",
      capacity: 1,
      status: "Available"
    },
    {
      id: uid("res"),
      name: "ICU Bed 04",
      type: "Bed",
      location: "Zone B",
      capacity: 1,
      status: "Available"
    },
    {
      id: uid("res"),
      name: "Food Kit Batch 20",
      type: "Food Kit",
      location: "Zone C",
      capacity: 20,
      status: "Available"
    },
    {
      id: uid("res"),
      name: "Volunteer Team Alpha",
      type: "Volunteer",
      location: "Zone A",
      capacity: 5,
      status: "Available"
    },
    {
      id: uid("res"),
      name: "Computer Lab 2",
      type: "Lab",
      location: "Zone D",
      capacity: 60,
      status: "Available"
    }
  ];

  const requests = [
    {
      id: uid("req"),
      requester: "Emergency Desk",
      need: "Ambulance",
      location: "Zone A",
      priority: "High",
      desc: "Accident case needs immediate ambulance.",
      status: "Pending"
    },
    {
      id: uid("req"),
      requester: "Relief Camp B",
      need: "Food Kit",
      location: "Zone C",
      priority: "Medium",
      desc: "Food required for families.",
      status: "Pending"
    },
    {
      id: uid("req"),
      requester: "CSE Department",
      need: "Lab",
      location: "Zone D",
      priority: "Low",
      desc: "Lab needed for workshop.",
      status: "Pending"
    }
  ];

  setData(STORAGE.resources, resources);
  setData(STORAGE.requests, requests);
  setData(STORAGE.history, []);

  if (document.getElementById("totalResources")) {
    loadDashboard();
  }

  alert("Demo data loaded successfully");
}

function loadDashboard() {
  const user = JSON.parse(localStorage.getItem(STORAGE.user) || "{}");
  const resources = getData(STORAGE.resources);
  const requests = getData(STORAGE.requests);
  const history = getData(STORAGE.history);

  document.getElementById("welcomeText").innerText =
    `Welcome ${user.name || "User"} • Role: ${user.role || "Admin"}`;

  const available = resources.filter(r => r.status === "Available").length;
  const pending = requests.filter(r => r.status === "Pending").length;
  const allocated = resources.filter(r => r.status === "Allocated").length;
  const usage = resources.length ? Math.round((allocated / resources.length) * 100) : 0;

  document.getElementById("totalResources").innerText = resources.length;
  document.getElementById("availableResources").innerText = available;
  document.getElementById("pendingRequests").innerText = pending;
  document.getElementById("totalAllocations").innerText = history.length;
  document.getElementById("usagePercent").innerText = usage + "%";
  document.getElementById("usageBar").style.width = usage + "%";

  document.getElementById("aiInsight").innerText =
    generateDashboardInsight(resources, requests);

  document.getElementById("recentActivity").innerHTML =
    history.slice(-5).reverse().map(h => `
      <div class="activity-item">
        ${h.time} — <b>${h.resourceName}</b> allocated for <b>${h.need}</b>
      </div>
    `).join("") || `<p class="muted">No recent activity yet.</p>`;
}

function generateDashboardInsight(resources, requests) {
  const highPending = requests.filter(
    r => r.status === "Pending" && r.priority === "High"
  );

  const available = resources.filter(r => r.status === "Available");
  const pending = requests.filter(r => r.status === "Pending");

  if (highPending.length > 0) {
    return `High priority demand detected. ${highPending.length} urgent request(s) are pending. Run Smart Allocation to assign nearest matching resources immediately.`;
  }

  if (available.length === 0 && resources.length > 0) {
    return "All resources are currently allocated. Add more resources or release completed allocations to avoid shortage.";
  }

  if (pending.length === 0) {
    return "System is stable. No pending requests. Resource availability is ready for new demand.";
  }

  return "Medium/low priority requests are waiting. Allocation can be optimized by matching type, location and availability.";
}

function saveResource() {
  const id = document.getElementById("resourceEditId").value;
  const name = document.getElementById("resourceName").value.trim();
  const type = document.getElementById("resourceType").value;
  const location = document.getElementById("resourceLocation").value;
  const capacity = Number(document.getElementById("resourceCapacity").value || 1);

  if (!name) {
    alert("Enter resource name");
    return;
  }

  let resources = getData(STORAGE.resources);

  if (id) {
    resources = resources.map(r =>
      r.id === id ? { ...r, name, type, location, capacity } : r
    );
  } else {
    resources.push({
      id: uid("res"),
      name,
      type,
      location,
      capacity,
      status: "Available"
    });
  }

  setData(STORAGE.resources, resources);
  resetResourceForm();
  loadResources();
}

function resetResourceForm() {
  document.getElementById("resourceEditId").value = "";
  document.getElementById("resourceName").value = "";
  document.getElementById("resourceCapacity").value = "";
  document.getElementById("resourceFormTitle").innerText = "Add Resource";
}

function loadResources() {
  const search = (document.getElementById("resourceSearch")?.value || "").toLowerCase();

  const resources = getData(STORAGE.resources).filter(r =>
    r.name.toLowerCase().includes(search) ||
    r.type.toLowerCase().includes(search) ||
    r.location.toLowerCase().includes(search)
  );

  document.getElementById("resourceTable").innerHTML =
    resources.map(r => `
      <tr>
        <td>${r.name}</td>
        <td>${r.type}</td>
        <td>${r.location}</td>
        <td>${r.capacity}</td>
        <td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
        <td>
          <button class="small-btn" onclick="editResource('${r.id}')">Edit</button>
          <button class="small-btn" onclick="toggleResource('${r.id}')">Toggle</button>
          <button class="small-btn delete-small" onclick="deleteResource('${r.id}')">Delete</button>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="6">No resources found.</td></tr>`;
}

function editResource(id) {
  const r = getData(STORAGE.resources).find(x => x.id === id);

  if (!r) return;

  document.getElementById("resourceEditId").value = r.id;
  document.getElementById("resourceName").value = r.name;
  document.getElementById("resourceType").value = r.type;
  document.getElementById("resourceLocation").value = r.location;
  document.getElementById("resourceCapacity").value = r.capacity;
  document.getElementById("resourceFormTitle").innerText = "Edit Resource";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleResource(id) {
  const resources = getData(STORAGE.resources).map(r => {
    if (r.id === id) {
      return {
        ...r,
        status: r.status === "Available" ? "Allocated" : "Available"
      };
    }

    return r;
  });

  setData(STORAGE.resources, resources);
  loadResources();
}

function deleteResource(id) {
  if (!confirm("Delete this resource?")) return;

  setData(
    STORAGE.resources,
    getData(STORAGE.resources).filter(r => r.id !== id)
  );

  loadResources();
}

function createRequest() {
  const requester = document.getElementById("requesterName").value.trim();
  const need = document.getElementById("requestNeed").value;
  const location = document.getElementById("requestLocation").value;
  const priority = document.getElementById("requestPriority").value;
  const desc = document.getElementById("requestDesc").value.trim();

  if (!requester) {
    alert("Enter requester name");
    return;
  }

  const requests = getData(STORAGE.requests);

  requests.push({
    id: uid("req"),
    requester,
    need,
    location,
    priority,
    desc,
    status: "Pending"
  });

  setData(STORAGE.requests, requests);

  document.getElementById("requesterName").value = "";
  document.getElementById("requestDesc").value = "";

  loadRequests();
}

function loadRequests() {
  const filter = document.getElementById("requestFilter")?.value || "All";

  let requests = getData(STORAGE.requests);

  if (filter !== "All") {
    requests = requests.filter(r => r.status === filter);
  }

  document.getElementById("requestTable").innerHTML =
    requests.map(r => `
      <tr>
        <td>${r.requester}</td>
        <td>${r.need}</td>
        <td>${r.location}</td>
        <td><span class="badge ${r.priority.toLowerCase()}">${r.priority}</span></td>
        <td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
        <td>
          ${r.status === "Pending"
            ? `<button class="small-btn" onclick="allocateSingle('${r.id}')">Allocate</button>`
            : ""}
          <button class="small-btn delete-small" onclick="deleteRequest('${r.id}')">Delete</button>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="6">No requests found.</td></tr>`;
}

function deleteRequest(id) {
  if (!confirm("Delete this request?")) return;

  setData(
    STORAGE.requests,
    getData(STORAGE.requests).filter(r => r.id !== id)
  );

  loadRequests();
}

function priorityValue(priority) {
  if (priority === "High") return 100;
  if (priority === "Medium") return 60;
  return 30;
}

function scoreResource(request, resource) {
  let score = 0;

  if (resource.status === "Available") score += 50;
  if (resource.type === request.need) score += 80;
  if (resource.location === request.location) score += 40;

  score += Math.min(Number(resource.capacity || 1), 20);
  score += priorityValue(request.priority);

  return score;
}

function findBestResource(request) {
  const resources = getData(STORAGE.resources)
    .filter(r => r.status === "Available");

  const scored = resources
    .map(resource => ({
      resource,
      score: scoreResource(request, resource)
    }))
    .filter(item => item.resource.type === request.need)
    .sort((a, b) => b.score - a.score);

  return scored[0] || null;
}

function allocateSingle(requestId) {
  const result = runAllocation(requestId);

  alert(result.message);

  if (document.getElementById("requestTable")) {
    loadRequests();
  }

  if (document.getElementById("pendingRequestList")) {
    loadAllocationPage();
  }
}

function runAllocation(requestId) {
  let requests = getData(STORAGE.requests);
  let resources = getData(STORAGE.resources);
  let history = getData(STORAGE.history);

  const req = requests.find(
    r => r.id === requestId && r.status === "Pending"
  );

  if (!req) {
    return {
      success: false,
      message: "Request not found or already assigned."
    };
  }

  const best = findBestResource(req);

  if (!best) {
    return {
      success: false,
      message: `No available ${req.need} resource found.`
    };
  }

  const reason =
    `Selected ${best.resource.name} because it matches ${req.need}, has ${best.resource.status} status, and ${best.resource.location === req.location ? "is in the same location" : "is the best available option"}. Priority score: ${req.priority}.`;

  resources = resources.map(r =>
    r.id === best.resource.id ? { ...r, status: "Allocated" } : r
  );

  requests = requests.map(r =>
    r.id === req.id
      ? { ...r, status: "Assigned", allocatedResourceId: best.resource.id }
      : r
  );

  history.push({
    id: uid("his"),
    time: new Date().toLocaleString(),
    requestId: req.id,
    requester: req.requester,
    need: req.need,
    resourceId: best.resource.id,
    resourceName: best.resource.name,
    location: req.location,
    reason
  });

  setData(STORAGE.resources, resources);
  setData(STORAGE.requests, requests);
  setData(STORAGE.history, history);

  return {
    success: true,
    message: `${best.resource.name} allocated successfully.`,
    reason
  };
}

function loadAllocationPage() {
  const requests = getData(STORAGE.requests)
    .filter(r => r.status === "Pending")
    .sort((a, b) => priorityValue(b.priority) - priorityValue(a.priority));

  document.getElementById("pendingRequestList").innerHTML =
    requests.map(r => `
      <div class="mini-card">
        <h3>
          ${r.need}
          <span class="badge ${r.priority.toLowerCase()}">${r.priority}</span>
        </h3>

        <p>${r.requester} needs ${r.need} at ${r.location}</p>

        <button class="primary-btn" onclick="allocateFromPanel('${r.id}')">
          Allocate Best Resource
        </button>
      </div>
    `).join("") || `<p class="muted">No pending requests available.</p>`;

  document.getElementById("allocationAiText").innerText =
    requests.length
      ? "Pending requests found. High priority requests will be processed first using type match, location match and availability score."
      : "No pending requests. System is stable.";
}

function allocateFromPanel(id) {
  const result = runAllocation(id);

  document.getElementById("allocationResult").innerHTML = `
    <div class="mini-card">
      <h3>${result.success ? "Allocation Success" : "Allocation Failed"}</h3>
      <p>${result.message}</p>
      <p>${result.reason || ""}</p>
    </div>
  `;

  document.getElementById("allocationAiText").innerText =
    result.reason || result.message;

  loadAllocationPage();
}

function autoAllocateAll() {
  const pending = getData(STORAGE.requests)
    .filter(r => r.status === "Pending")
    .sort((a, b) => priorityValue(b.priority) - priorityValue(a.priority));

  if (!pending.length) {
    alert("No pending requests");
    return;
  }

  let successCount = 0;
  let lastReason = "";

  pending.forEach(req => {
    const result = runAllocation(req.id);

    if (result.success) {
      successCount++;
      lastReason = result.reason;
    }
  });

  document.getElementById("allocationResult").innerHTML = `
    <div class="mini-card">
      <h3>Auto Allocation Completed</h3>
      <p>${successCount} request(s) assigned successfully.</p>
    </div>
  `;

  document.getElementById("allocationAiText").innerText =
    lastReason || "No matching resource found for pending requests.";

  loadAllocationPage();
}

function loadHistory() {
  const history = getData(STORAGE.history);

  document.getElementById("historyTable").innerHTML =
    history.slice().reverse().map(h => `
      <tr>
        <td>${h.time}</td>
        <td>${h.need} for ${h.requester}</td>
        <td>${h.resourceName}</td>
        <td>${h.location}</td>
        <td>${h.reason}</td>
      </tr>
    `).join("") || `<tr><td colspan="5">No allocation history yet.</td></tr>`;
}

function clearHistory() {
  if (!confirm("Clear all history?")) return;

  setData(STORAGE.history, []);
  loadHistory();
      }
