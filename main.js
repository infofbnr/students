// main.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, where, orderBy, serverTimestamp, addDoc } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-storage.js";

// 🔧 Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCHYnW3qaNo7oGKMPs9DFALdWXIeYv6ixY",
  authDomain: "gossip-38bf8.firebaseapp.com",
  projectId: "gossip-38bf8",
  storageBucket: "gossip-38bf8.firebasestorage.app",
  messagingSenderId: "224975261462",
  appId: "1:224975261462:web:f08fd243ec4a5c1a4a4a37",
  measurementId: "G-N7S9894R3N"
};

// ✅ Initialize Firebase App (only once)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
// ✅ Get Auth
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
// =======================
// Navbar Buttons
// =======================
const loginBtn = document.getElementById("login-btn");
const accountBtn = document.getElementById("account-btn");


onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is logged in
    if (loginBtn) loginBtn.classList.add("hidden");
    if (accountBtn) accountBtn.classList.remove("hidden");
  } else {
    // User is logged out
    if (loginBtn) loginBtn.classList.remove("hidden");
    if (accountBtn) accountBtn.classList.add("hidden");
  }
});
// =======================
// DOM Ready
// =======================
// =======================
document.addEventListener("DOMContentLoaded", async () => {
  // Subjects data
  const subjects = {
    english: [
      "English",
      "Arabic",
      "Tarikh",
      "Tarbia",
      "Joghrafia",
      "Philosophy",
      "Sociology",
      "Economics",
      "Chemistry",
      "Math",
      "Biology",
      "Physics"
    ],
    french: [
      "Sciences",
      "Mathématiques",
      "Histoire-Géo",
      "Philosophie",
      "Français",
      "Anglais",
      "Arabe",
      "EMC",
      "SVT",
      "Physique",
      "Chimie",
      "SES",
      "Spécialité",
      "Sport"
    ]
  };

  const curriculumSelect = document.getElementById("curriculum");
  const subjectSelect = document.getElementById("subject");
  const gradeSelect = document.getElementById("grade");
  const sectionTitle = document.getElementById("section-title");
  const postsContainer = document.getElementById("posts-container");

  // =======================
  // Toggle tree menus
  // =======================
  window.toggleTree = function(treeId) {
    const tree = document.getElementById(treeId);
    tree.classList.toggle("open");
  };

  // =======================
  // Curriculum -> Subject
  // =======================
  if (curriculumSelect && subjectSelect) {
    curriculumSelect.addEventListener("change", () => {
      const curriculum = curriculumSelect.value;
      subjectSelect.innerHTML = "";

      if (!curriculum) {
        subjectSelect.disabled = true;
        subjectSelect.innerHTML = `<option value="">-- Select a curriculum first --</option>`;
        return;
      }

      subjects[curriculum].forEach(subj => {
        const option = document.createElement("option");
        option.value = subj.toLowerCase().replace(/\s+/g, "-");
        option.textContent = subj;
        subjectSelect.appendChild(option);
      });

      subjectSelect.disabled = false;
    });
  }


  // =======================
  // Load posts dynamically
  // =======================
  async function loadPosts(curriculum, subject, grade) {
    if (!postsContainer) return;

    postsContainer.innerHTML = "Loading posts...";

    let postsQuery = collection(db, "posts");

    const filters = [];
    if (curriculum) filters.push(where("curriculum", "==", curriculum));
    if (subject) filters.push(where("subject", "==", subject));
    if (grade) filters.push(where("grade", "==", grade));

    const qSnap = await getDocs(query(postsQuery, ...filters, orderBy("createdAt", "desc")));
    const posts = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    renderPosts(posts);
  }

  function renderPosts(posts) {
    postsContainer.innerHTML = "";

    if (!posts.length) {
      postsContainer.innerHTML = `<p class="text-gray-500">No posts found.</p>`;
      return;
    }

    const fragment = document.createDocumentFragment();
    posts.forEach(post => {
      const div = document.createElement("div");
      div.className = "bg-white p-4 rounded shadow hover:shadow-md transition";

      div.innerHTML = `
        <h3 class="text-lg font-bold">${post.title}</h3>
        <p class="text-gray-700">${post.description}</p>
        <p class="text-xs text-gray-500 mt-1">Subject: ${post.subject} | Grade: ${post.grade}</p>
        <p class="text-xs text-gray-500">Posted by: ${post.username || 'Anonymous'}</p>
      `;

      // Create view button
      const viewBtn = document.createElement("button");
      viewBtn.textContent = "View";
      viewBtn.className = "mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition";
      viewBtn.addEventListener("click", () => {
        // Navigate to view page with post ID
        window.location.href = `view/index.html?id=${post.id}`;
      });

      div.appendChild(viewBtn);
      postsContainer.appendChild(div);
    });

    postsContainer.appendChild(fragment);

    // Add click listener for all view buttons
    fragment.querySelectorAll(".view-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const postId = btn.dataset.id;
        window.location.href = `view/index.html?id=${postId}`;
      });
    });
  }



  // =======================
  // Subject / Grade Selection -> Load Posts
  // =======================
  if (subjectSelect) {
    subjectSelect.addEventListener("change", () => {
      const curriculum = curriculumSelect.value;
      const subject = subjectSelect.value;
      const grade = gradeSelect ? gradeSelect.value : null;

      const sectionTitle = document.getElementById("section-title");
      if (sectionTitle) {
        if (subject) {
          const [curriculumName, subjectName] = subject.split("-");
          const prettyCurriculum =
            curriculumName === "english" ? "English Bac" :
            curriculumName === "french" ? "French Bac" :
            curriculumName.charAt(0).toUpperCase() + curriculumName.slice(1);
          const prettySubject =
            subjectName.charAt(0).toUpperCase() + subjectName.slice(1);

          sectionTitle.textContent = `Posts for ${prettyCurriculum}: ${prettySubject}`;
        } else {
          sectionTitle.textContent = "Select a subject to view posts";
        }
      }

      loadPosts(curriculum, subject, grade);
    });
  }


  if (gradeSelect) {
    gradeSelect.addEventListener("change", () => {
      const curriculum = curriculumSelect.value;
      const subject = subjectSelect.value;
      const grade = gradeSelect.value;

      loadPosts(curriculum, subject, grade);
    });
  }

  // =======================
  // Tree buttons load posts
  // =======================
  document.querySelectorAll(".tree-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.section;

      const [curriculumName, subjectName] = section.split("-");
      const prettyCurriculum =
        curriculumName === "english" ? "English Bac" :
        curriculumName === "french" ? "French Bac" :
        curriculumName.charAt(0).toUpperCase() + curriculumName.slice(1);
      const prettySubject =
        subjectName.charAt(0).toUpperCase() + subjectName.slice(1);

      sectionTitle.textContent = `Posts for ${prettyCurriculum}: ${prettySubject}`;

      const grade = gradeSelect ? gradeSelect.value : null;
      loadPosts(curriculumName, subjectName, grade);
    });
  });

  const q = (sel) => document.querySelector(sel);

// Form submission
  const postForm = q("#post-form");
  if (postForm) {
    postForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const user = auth.currentUser;
      const errorEl = q("#post-error");
      if (errorEl) errorEl.innerText = "";

      // Require logged-in + verified user
      if (!user || !user.emailVerified) { 
        if (errorEl) errorEl.innerText = "Login and verify your email to post.";
        return;
      }

      const title = q("#title")?.value.trim();
      const description = q("#description")?.value.trim();
      const subject = q("#subject")?.value;
      const grade = q("#grade")?.value;
      const mediaFile = q("#media-file")?.files[0]; // optional

      if (!title || !description || !subject || !grade) {
        if (errorEl) errorEl.innerText = "All fields are required.";
        return;
      }

      try {
        let mediaUrl = null;

        if (mediaFile) {
          // ✅ Upload to user's folder inside "uploads"
          const safeFileName = mediaFile.name.replace(/\s+/g, "_"); // avoid spaces
          const storageRef = ref(storage, `uploads/${user.uid}/${Date.now()}_${safeFileName}`);
          const snapshot = await uploadBytes(storageRef, mediaFile);
          mediaUrl = await getDownloadURL(snapshot.ref);
        }
        // Build section string like "english-science"

        const curriculum = curriculumSelect.value;

        // Save post in Firestore
        await addDoc(collection(db, "posts"), {
          title,
          description,
          curriculum,           // ✅ store curriculum separately
          subject,
          grade,
          authorId: user.uid,
          username: user.displayName || "Anonymous",
          createdAt: serverTimestamp(),
          media: mediaUrl
        });

        // Clear form
        q("#title").value = "";
        q("#description").value = "";
        q("#subject").value = "";
        q("#grade").value = "";
        if (q("#media-file")) q("#media-file").value = "";

        alert("Post submitted successfully!");
        window.location.href = "../";

      } catch (err) {
        if (errorEl) errorEl.innerText = err.message;
        console.error(err);
      }
    });
  }

  const postContainer = document.getElementById("post-container");
  if (!postContainer) return; // stop if element doesn't exist

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");
  if (!postId) {
    postContainer.innerHTML = "<p class='text-red-500'>No post selected.</p>";
    return;
  }

  try {
    const docRef = doc(db, "posts", postId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      postContainer.innerHTML = "<p class='text-red-500'>Post not found.</p>";
      return;
    }

    const post = docSnap.data();

    postContainer.innerHTML = `
      <h2 class="text-2xl font-bold mb-2">${post.title}</h2>
      <p class="text-gray-700 mb-2">${post.description}</p>
      ${post.media ? `<img src="${post.media}" class="mb-2 rounded w-full"/>` : ""}
      <p class="text-xs text-gray-500">Subject: ${post.subject} | Grade: ${post.grade}</p>
      <p class="text-xs text-gray-500">Posted by: ${post.username || 'Anonymous'}</p>
      <p class="text-xs text-gray-400">Posted on: ${post.createdAt?.toDate().toLocaleString() || ''}</p>
    `;
  } catch (err) {
    postContainer.innerHTML = `<p class='text-red-500'>Error loading post: ${err.message}</p>`;
    console.error(err);
  }
});
