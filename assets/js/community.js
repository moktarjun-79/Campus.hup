if (document.getElementById("postForm")) {
    (function () {
        const student = currentUser();

        if (!student || student.role !== "student") {
            window.location.href = "../login.html";
            return;
        }

        const postForm = document.getElementById("postForm");
        const postContent = document.getElementById("postContent");
        const postSearch = document.getElementById("postSearch");
        const postsList = document.getElementById("postsList");
        const messageBox = document.getElementById("serviceMessage");
        const logoutButton = document.getElementById("logoutBtn");
        const studentName = document.getElementById("studentName");

        if (studentName) {
            const fullName = ((student.firstName || "") + " " + (student.lastName || "")).trim();
            studentName.textContent = fullName || student.matricule || "Student";
        }

        const POSTS_KEY = KEYS.POSTS;
        const COMMENTS_KEY = KEYS.COMMENTS;
        const LIKES_KEY = KEYS.LIKES;
        const REPORTS_KEY = KEYS.REPORTS;

        function showCommunityMessage(message, type) {
            if (!messageBox) return;

            const messageType = type || "success";
            messageBox.innerHTML =
                '<div class="alert alert-' + messageType + '">' +
                escapeHTML(message) + "</div>";
        }

        function getStudentName(userId) {
            const users = getData(KEYS.USERS);
            const user = users.find(function (item) {
                return item.id === userId;
            });

            if (!user) return "Student";

            return ((user.firstName || "") + " " + (user.lastName || "")).trim();
        }

        function formatPostDate(date) {
            if (!date) return "";
            return new Date(date).toLocaleString();
        }

        function renderPosts() {
            const searchText = postSearch.value.trim().toLowerCase();
            const posts = getData(POSTS_KEY);
            const comments = getData(COMMENTS_KEY);
            const likes = getData(LIKES_KEY);

            const visiblePosts = posts.filter(function (post) {
                return (post.content || "").toLowerCase().includes(searchText);
            });

            let html = "";

            visiblePosts.forEach(function (post) {
                const postComments = comments.filter(function (comment) {
                    return comment.postId === post.id;
                });

                const postLikes = likes.filter(function (like) {
                    return like.postId === post.id;
                });

                const likedByStudent = postLikes.some(function (like) {
                    return like.userId === student.id;
                });

                const isOwner = post.userId === student.id;

                html += `
                    <article class="post-item community-post">
                        <div class="community-post-heading">
                            <div>
                                <h5>${escapeHTML(getStudentName(post.userId))}</h5>
                                <small>${escapeHTML(formatPostDate(post.createdAt))}</small>
                            </div>
                        </div>

                        <p class="post-content">${escapeHTML(post.content)}</p>

                        <div class="service-item-actions">
                            <button class="btn btn-sm btn-outline-primary"
                                type="button" data-like-post="${escapeHTML(post.id)}">
                                <i class="bi bi-hand-thumbs-up"></i>
                                ${likedByStudent ? "Unlike" : "Like"} (${postLikes.length})
                            </button>

                            ${isOwner ? `
                                <button class="btn btn-sm btn-outline-danger"
                                    type="button" data-delete-post="${escapeHTML(post.id)}">
                                    Delete
                                </button>
                            ` : `
                                <button class="btn btn-sm btn-outline-secondary"
                                    type="button" data-report-post="${escapeHTML(post.id)}">
                                    Report
                                </button>
                            `}
                        </div>

                        <form class="community-comment-form mt-3"
                            data-comment-form="${escapeHTML(post.id)}">
                            <div class="input-group">
                                <input class="form-control" name="comment"
                                    type="text" placeholder="Write a comment..." required>
                                <button class="btn btn-primary" type="submit">Comment</button>
                            </div>
                        </form>

                        <div class="community-comments mt-3">
                            ${postComments.map(function (comment) {
                                return `
                                    <div class="community-comment">
                                        <strong>${escapeHTML(getStudentName(comment.userId))}</strong>
                                        <p>${escapeHTML(comment.content)}</p>
                                        ${comment.userId === student.id ? `
                                            <button class="btn btn-sm text-danger"
                                                type="button"
                                                data-delete-comment="${escapeHTML(comment.id)}">
                                                Delete comment
                                            </button>
                                        ` : ""}
                                    </div>
                                `;
                            }).join("")}
                        </div>
                    </article>
                `;
            });

            postsList.innerHTML = html ||
                '<div class="empty-state">No discussions found. Start the conversation.</div>';
        }

        postForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const content = postContent.value.trim();

            if (!content) {
                showCommunityMessage("Write something before publishing.", "warning");
                return;
            }

            const posts = getData(POSTS_KEY);

            posts.unshift({
                id: makeId(),
                userId: student.id,
                content: content,
                createdAt: new Date().toISOString()
            });

            saveData(POSTS_KEY, posts);
            addLog("Community", "New post published");
            postForm.reset();
            showCommunityMessage("Your post has been published.");
            renderPosts();
        });

        postsList.addEventListener("submit", function (event) {
            const form = event.target.closest("[data-comment-form]");
            if (!form) return;

            event.preventDefault();

            const content = form.elements.comment.value.trim();
            if (!content) return;

            const comments = getData(COMMENTS_KEY);
            comments.push({
                id: makeId(),
                postId: form.dataset.commentForm,
                userId: student.id,
                content: content,
                createdAt: new Date().toISOString()
            });

            saveData(COMMENTS_KEY, comments);
            renderPosts();
        });

        postsList.addEventListener("click", function (event) {
            const likeButton = event.target.closest("[data-like-post]");
            const deleteButton = event.target.closest("[data-delete-post]");
            const reportButton = event.target.closest("[data-report-post]");
            const deleteCommentButton = event.target.closest("[data-delete-comment]");

            if (likeButton) {
                const likes = getData(LIKES_KEY);
                const postId = likeButton.dataset.likePost;
                const existingIndex = likes.findIndex(function (like) {
                    return like.postId === postId && like.userId === student.id;
                });

                if (existingIndex >= 0) {
                    likes.splice(existingIndex, 1);
                } else {
                    likes.push({
                        id: makeId(),
                        postId: postId,
                        userId: student.id
                    });
                }

                saveData(LIKES_KEY, likes);
            }

            if (deleteButton) {
                if (!confirm("Delete your post?")) return;

                const postId = deleteButton.dataset.deletePost;
                const posts = getData(POSTS_KEY).filter(function (post) {
                    return !(post.id === postId && post.userId === student.id);
                });

                saveData(POSTS_KEY, posts);
            }

            if (reportButton) {
                const postId = reportButton.dataset.reportPost;
                const reports = getData(REPORTS_KEY);
                const alreadyReported = reports.some(function (report) {
                    return report.postId === postId && report.userId === student.id;
                });

                if (alreadyReported) {
                    showCommunityMessage("You have already reported this post.", "warning");
                    return;
                }

                reports.push({
                    id: makeId(),
                    postId: postId,
                    userId: student.id,
                    type: "Post",
                    reason: "Reported by student",
                    status: "Pending",
                    createdAt: new Date().toISOString()
                });

                saveData(REPORTS_KEY, reports);
                showCommunityMessage("Your report has been sent.");
            }

            if (deleteCommentButton) {
                if (!confirm("Delete this comment?")) return;

                const commentId = deleteCommentButton.dataset.deleteComment;
                const comments = getData(COMMENTS_KEY).filter(function (comment) {
                    return !(comment.id === commentId && comment.userId === student.id);
                });

                saveData(COMMENTS_KEY, comments);
            }

            renderPosts();
        });

        postSearch.addEventListener("input", renderPosts);

        if (logoutButton) {
            logoutButton.addEventListener("click", function () {
                if (confirm("Are you sure you want to logout?")) {
                    addLog("Logout", "Student logged out: " + student.matricule);
                    logoutUser();
                }
            });
        }

        renderPosts();
    })();
}
