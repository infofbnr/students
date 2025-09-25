// main.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-app.js";
import { getFirestore, deleteDoc, collection, getDocs, updateDoc, doc, getDoc, query, where, orderBy, serverTimestamp, addDoc } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-storage.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  signOut 
} from "https://www.gstatic.com/firebasejs/9.9.3/firebase-auth.js";

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
      "Spécialité"
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

const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email")?.value.trim();
    const password = document.getElementById("signup-password")?.value;
    const username = document.getElementById("signup-username")?.value.trim();
    const errorEl = document.getElementById("signup-error");
    if (errorEl) errorEl.innerText = "";

    if (!email || !password || !username) {
      if (errorEl) errorEl.innerText = "All fields are required.";
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Set displayName
      await user.updateProfile({ displayName: username });

      // Add user to Firestore
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        email: user.email,
        username,
        createdAt: serverTimestamp()
      });

      // Send verification email
      await sendEmailVerification(user);

      alert("Account created! Please verify your email before logging in.");
      signupForm.reset();
      window.location.href = "../login/";

    } catch (err) {
      if (errorEl) errorEl.innerText = err.message;
      console.error(err);
    }
  });
}

// Login form
const loginForm = document.getElementById("login-form");
if (loginForm) {
  const loginBtn = loginForm.querySelector("button");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginBtn.disabled = true;
    loginBtn.innerText = "Logging in...";
    try {
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const errorEl = document.getElementById("login-error");
      if (errorEl) errorEl.innerText = "";

      if (!email || !password) {
        if (errorEl) errorEl.innerText = "Both email and password are required.";
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        alert("Please verify your email before logging in.");
        await signOut(auth);
        return;
      }

      window.location.href = "../posts/";
    } catch (err) {
      const errorEl = document.getElementById("login-error");
      if (errorEl) errorEl.innerText = err.message;
      console.error(err);
    } finally {
      loginBtn.disabled = false;
      loginBtn.innerText = "Login";
    }
  });
}



// Logout button already exists, but just in case
const logoutBtns = document.querySelectorAll(".logout-btn");
logoutBtns.forEach(btn => {
  btn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "../login/";
    } catch (err) {
      console.error("Logout error:", err);
    }
  });
});
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
      div.className = "bg-white p-4 rounded shadow hover:shadow-md transition flex flex-col gap-2";

      div.innerHTML = `
        <h3 class="text-lg font-bold">${post.title}</h3>
        <p class="text-gray-700">${post.description}</p>
        <p class="text-xs text-gray-500 mt-1">Subject: ${post.subject} | Grade: ${post.grade}</p>
        <p class="text-xs text-gray-500">Posted by: @${post.username || 'Anonymous'}</p>
      `;

      // Create buttons container
      const btnContainer = document.createElement("div");
      btnContainer.className = "flex gap-2 mt-2";

      // View button
      const viewBtn = document.createElement("button");
      viewBtn.textContent = "View";
      viewBtn.className = "bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition";
      viewBtn.addEventListener("click", () => {
        window.location.href = `view?id=${post.id}`;
      });


      btnContainer.appendChild(viewBtn);

      // Delete button (only for poster)
      if (auth.currentUser && auth.currentUser.uid === post.authorId) {
        const deleteBtn = document.createElement("img");
        deleteBtn.src = "delete.png"; // path to your PNG
        deleteBtn.alt = "Delete";
        deleteBtn.className = "w-6 h-6 cursor-pointer";

        deleteBtn.addEventListener("click", async () => {
          if (confirm("Are you sure you want to delete this post?")) {
            await deleteDoc(doc(db, "posts", post.id));
            renderPosts(posts.filter(p => p.id !== post.id));
          }
        });

        btnContainer.appendChild(deleteBtn);
      }

      div.appendChild(btnContainer);
      fragment.appendChild(div);
    });

    postsContainer.appendChild(fragment);
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
          const parts = subject.split("-");
          const curriculumName = parts[0];
          const subjectName = parts.slice(1).join("-");

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

      const parts = section.split("-");
      const curriculumName = parts[0];
      const subjectName = parts.slice(1).join("-");

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
          media: mediaUrl,
          aiAnswerSent: false     // ✅ ensures AI hasn't answered yet
        });

        // Clear form
        q("#title").value = "";
        q("#description").value = "";
        q("#subject").value = "";
        q("#grade").value = "";
        if (q("#media-file")) q("#media-file").value = "";

        alert("Post submitted successfully!");
        window.location.href = "../posts/";

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
      <p class="text-xs text-gray-500">Posted by: @${post.username || 'Anonymous'} on ${post.createdAt?.toDate().toLocaleString([], 
        {year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"})
      || ''}</p>
    `;
    // === After rendering the post ===
    // === Auto AI Answer (after rendering post) ===
    if (post && !post.aiAnswerSent) { // ✅ only run if AI hasn't answered yet
      const subject = post.subject?.toLowerCase() || "";
      const title = post.title || "";
      const description = post.description || "";

      // === Barriers ===
      const tooShort = description.length < 20;
      const tooLong = description.length > 1000;
      const notUnderstandable = !/[a-zA-Z0-9]/.test(description);

      // ✅ Allowed subjects only
      const allowedSubjects = ["math", "physics", "chemistry","english"]; // customize here
      const isAllowedSubject = allowedSubjects.includes(subject);

      function xorObfuscate(data, key) {
        return data.split('').map((char, i) => 
            String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
        ).join('');
      }

      function base64Decode(data) {
          return atob(data);
      }

      function simpleDecode(encodedKey) {
          const decodedKey = base64Decode(encodedKey);
          const xorKey = 'simplekey';
          return xorObfuscate(decodedKey, xorKey);
      }

      const encodedKey = "AAJAAB4KAUg6KyxdFV4uPx89HThZAzMWXBABCRgDQFkmCS5KIAI7OAQHOSAJQlsUQCI/Gg4YHS89AQY6OScSGlgePhwuLCcPGi4yKQYAH1EuIj1eMgAHACMzMhkuAQ43BR9KGDhVERwpJQo3LAw5FDgyLxQDKiEsQzsSKlcvCjMPGAULL1c+O18HJTkyGDc7SxEYQQspCQY7LDk7FwE9X1c4ECg=";
      const apiKey = simpleDecode(encodedKey);

      if (!(tooShort || tooLong || notUnderstandable) && isAllowedSubject) {
        try {
          const prompt = `Explain this homework question in a very simple, short way (like ELI5). Use plain words, simple math symbols (like √), and add line breaks between steps. Keep it easy to read.\n\nTitle: ${title}\n\nDescription: ${description}`;


          
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }]
            })
          });

          const data = await res.json();
          const aiAnswer = data.choices?.[0]?.message?.content.trim();

          if (aiAnswer) {
            // Store AI answer in Firestore as if it were a normal reply
            await addDoc(collection(db, "answers"), {
              postId,
              text: aiAnswer,
              authorId: "AI",              // fixed ID for AI
              username: "AI Tutor",        // display name
              createdAt: serverTimestamp()
            });

            // ✅ Mark post so AI won't answer again
            await updateDoc(doc(db, "posts", postId), { aiAnswerSent: true });

            // Refresh the answers list so AI shows up
            loadAnswers();
          }
        } catch (err) {
          console.error("AI error:", err);
        }
      } else {
        console.log("AI skipped: barriers triggered.");
      }
    } else {
      console.log("AI already sent for this post.");
    }



  } catch (err) {
    postContainer.innerHTML = `<p class='text-red-500'>Error loading post: ${err.message}</p>`;
    console.error(err);
  }
  // Inside your DOMContentLoaded
  const answerForm = document.getElementById("answer-form");
  const answerText = document.getElementById("answer-text");
  const answersContainer = document.getElementById("answers-container");

  if (answerForm) {
    answerForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // stop default form submission

      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to submit an answer.");
        return;
      }

      const text = answerText.value.trim();
      if (!text) return;

      try {
        // Save answer to Firestore
        await addDoc(collection(db, "answers"), {
          postId,               // link answer to the current post
          text,
          authorId: user.uid,
          username: user.displayName || "Anonymous",
          createdAt: serverTimestamp()
        });

        answerText.value = ""; // clear textarea

        // Optionally reload answers
        loadAnswers(); 
      } catch (err) {
        console.error(err);
        alert("Error submitting answer: " + err.message);
      }
    });
  }

  // Load answers for this post
  async function loadAnswers() {
    const answersContainer = document.getElementById("answers-container");
    if (!answersContainer) return;

    answersContainer.innerHTML = "Loading answers...";
    try {
      const qSnap = await getDocs(
        query(
          collection(db, "answers"),
          where("postId", "==", postId),
          orderBy("createdAt", "asc")
        )
      );

      answersContainer.innerHTML = "";
      qSnap.docs.forEach(doc => {
        const ans = doc.data();
        const div = document.createElement("div");
        div.className = "bg-white p-2 rounded shadow";
        div.innerHTML = `<p class="text-sm" style="white-space: pre-line;">${ans.text}</p>
                        <p class="text-xs text-gray-500">by @${ans.username} on ${ans.createdAt?.toDate().toLocaleString([], {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        }) || ''}</p>`;

        answersContainer.appendChild(div);
      });
    } catch (err) {
      answersContainer.innerHTML = `<p class="text-red-500">Error loading answers</p>`;
      console.error(err);
    }
  }

  // Call it once after page load
  loadAnswers();


});
