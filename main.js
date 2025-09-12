// =======================
// Firebase Setup
// =======================
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/9.9.3/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  serverTimestamp,
  updateDoc,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.9.3/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.9.3/firebase-storage.js";

// 🔧 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCHYnW3qaNo7oGKMPs9DFALdWXIeYv6ixY",
  authDomain: "gossip-38bf8.firebaseapp.com",
  projectId: "gossip-38bf8",
  storageBucket: "gossip-38bf8.appspot.com",
  messagingSenderId: "224975261462",
  appId: "1:224975261462:web:f08fd243ec4a5c1a4a4a37",
  measurementId: "G-N7S9894R3N"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// =======================
// Utility
// =======================
const q = (sel) => document.querySelector(sel);
const hide = (el) => el && el.classList.add("hidden");
const show = (el) => el && el.classList.remove("hidden");

// =======================
// AUTH HANDLING
// =======================
const loginBtn = q("#login-btn");
const logoutBtn = q("#logout-btn");
const accountBtn = q("#account-btn");

onAuthStateChanged(auth, (user) => {
  if (user) {
    hide(loginBtn);
    show(logoutBtn);
    show(accountBtn);
  } else {
    show(loginBtn);
    hide(logoutBtn);
    hide(accountBtn);
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => signOut(auth));
}

// =======================
// LOGIN
// =======================
const loginForm = q("#login-form");
if (loginForm) {
  const errorEl = q("#login-error");
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.innerText = "";
    const email = q("#email").value.trim();
    const password = q("#password").value.trim();
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!cred.user.emailVerified) {
        errorEl.innerText = "Email not verified. Please verify your email first.";
        return;
      }
      window.location.href = "post.html";
    } catch (err) {
      errorEl.innerText = err.message;
    }
  });
}

// =======================
// SIGNUP
// =======================
const signupForm = q("#signup-form");
if (signupForm) {
  const errorEl = q("#signup-error");
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.innerText = "";
    const username = q("#username").value.trim();
    const email = q("#signup-email").value.trim();
    const password = q("#signup-password").value.trim();

    if (!username) { errorEl.innerText = "Username required"; return; }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: username });
      await sendEmailVerification(cred.user);
      await addDoc(collection(db, "users"), {
        uid: cred.user.uid,
        username: username,
        email: email,
        createdAt: serverTimestamp()
      });
      alert("Account created! Please verify your email before logging in.");
      window.location.href = "login.html";
    } catch (err) {
      errorEl.innerText = err.message;
    }
  });
}

// =======================
// PASSWORD RESET
// =======================
const resetBtn = q("#reset-password-btn");
if (resetBtn) {
  resetBtn.addEventListener("click", async () => {
    const email = q("#reset-email").value.trim();
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent!");
    } catch (err) {
      alert("Error: " + err.message);
    }
  });
}

// =======================
// POST CREATION (with images)
// =======================
const postForm = q("#post-form");
const overlay = q("#overlay");

// Helper for file uploads
async function uploadFile(file, folder, userId) {
  if (!file) return null;
  const fileRef = ref(storage, `${folder}/${userId}_${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

if (postForm) {
  onAuthStateChanged(auth, (user) => {
    if (!user || !user.emailVerified) {
      show(overlay);
      hide(postForm.parentElement);
    } else {
      hide(overlay);
      show(postForm.parentElement);
    }
  });

  postForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const errorEl = q("#post-error");
    errorEl.innerText = "";

    if (!user || !user.emailVerified) { 
      errorEl.innerText = "Login and verify your email to post.";
      return;
    }

    const title = q("#title").value.trim();
    const description = q("#description").value.trim();
    const subject = q("#subject").value;
    const grade = q("#grade").value;
    const imageFile = q("#media-file")?.files[0];

    if (!title || !description || !subject || !grade) {
      errorEl.innerText = "All fields are required";
      return;
    }

    try {
      const imageUrl = await uploadFile(imageFile, "posts/images", user.uid);

      await addDoc(collection(db, "posts"), {
        title,
        description,
        subject,
        grade,
        authorId: user.uid,
        username: user.displayName,
        createdAt: serverTimestamp(),
        image: imageUrl || null
      });
      window.location.href = "index.html";
    } catch (err) {
      errorEl.innerText = err.message;
    }
  });
}

// =======================
// LOAD POSTS (Homepage)
// =======================
async function loadPosts(filterGrade = "all") {
  const container = q("#posts-container");
  if (!container) return;

  let postsQuery = collection(db, "posts");

  // Filter by grade if needed
  if (filterGrade !== "all") {
    postsQuery = query(postsQuery, where("grade", "==", filterGrade));
  }

  // Sort by date descending (newest first)
  postsQuery = query(postsQuery, orderBy("createdAt", "desc"));

  const snapshot = await getDocs(postsQuery);
  container.innerHTML = "";

  if (snapshot.empty) {
    container.innerHTML = "<p>No posts found.</p>";
    return;
  }

  snapshot.forEach(docSnap => {
    const post = docSnap.data();
    container.innerHTML += `
      <div class="bg-white p-4 rounded shadow">
        <h3 class="text-lg font-bold">${post.title}</h3>
        <p>${post.description}</p>
        <p class="text-sm text-gray-500">Subject: ${post.subject} | Grade: ${post.grade}</p>
        <p class="text-sm text-gray-500">Posted by: ${post.username}</p>
        <a href="view.html?id=${docSnap.id}" class="text-blue-600 underline text-sm">View & Answer</a>
      </div>
    `;
  });
}
const gradeFilter = q("#grade-filter");
if (gradeFilter) {
  gradeFilter.addEventListener("change", () => loadPosts(gradeFilter.value));
  loadPosts(); // initial load
}

// =======================
// VIEW SINGLE POST + ANSWERS
// =======================
async function loadSinglePost() {
  const postContainer = q("#post-container");
  const answersContainer = q("#answers-container");
  if (!postContainer) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  const docRef = doc(db, "posts", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    postContainer.innerHTML = "<p>Post not found.</p>";
    return;
  }

  const post = docSnap.data();
  const imageHtml = post.image ? `<img src="${post.image}" class="my-2 rounded shadow max-h-64 w-full object-cover">` : "";

  postContainer.innerHTML = `
    <h2 class="text-xl font-bold mb-2">${post.title}</h2>
    <p>${post.description}</p>
    ${imageHtml}
    <p class="text-sm text-gray-500">Subject: ${post.subject} | Grade: ${post.grade}</p>
    <p class="text-sm text-gray-500">Posted by: ${post.username}</p>
  `;

  const answersSnap = await getDocs(collection(db, "posts", id, "answers"));
  answersContainer.innerHTML = "";
  answersSnap.forEach(ansDoc => {
    const ans = ansDoc.data();
    answersContainer.innerHTML += `
      <div class="bg-white p-3 rounded shadow">
        <p>${ans.text}</p>
        <p class="text-xs text-gray-500">by ${ans.username}</p>
      </div>
    `;
  });

  const answerForm = q("#answer-form");
  if (answerForm) {
    answerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      const errorEl = q("#answer-error");
      if (errorEl) errorEl.innerText = "";

      if (!user || !user.emailVerified) {
        if (errorEl) errorEl.innerText = "Login and verify your email to answer.";
        return;
      }

      const text = q("#answer-text").value.trim();
      if (!text) return;

      await addDoc(collection(db, "posts", id, "answers"), {
        text,
        authorId: user.uid,
        username: user.displayName,
        createdAt: serverTimestamp()
      });

      q("#answer-text").value = "";
      loadSinglePost();
    });
  }
}

loadSinglePost();
