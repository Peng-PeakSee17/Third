const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname);
const postsFile = path.join(dataDir, 'posts.json');
const usersFile = path.join(dataDir, 'users.json');

function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Posts
function getPosts() { return readJSON(postsFile); }
function savePosts(posts) { writeJSON(postsFile, posts); }
function getPostById(id) {
  return getPosts().find(p => p.id === id);
}
function addPost(post) {
  const posts = getPosts();
  posts.unshift(post);
  savePosts(posts);
  return post;
}
function toggleFavorite(postId, userId) {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return null;
  if (!post.favorites) post.favorites = [];
  const idx = post.favorites.indexOf(userId);
  if (idx === -1) {
    post.favorites.push(userId);
  } else {
    post.favorites.splice(idx, 1);
  }
  savePosts(posts);
  return post;
}

// Users
function getUsers() { return readJSON(usersFile); }
function saveUsers(users) { writeJSON(usersFile, users); }
function getUserByUsername(username) {
  return getUsers().find(u => u.username === username);
}
function getUserById(id) {
  return getUsers().find(u => u.id === id);
}
function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
  return user;
}
function addFavorite(userId, postId) {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  if (!user.favorites) user.favorites = [];
  if (!user.favorites.includes(postId)) {
    user.favorites.push(postId);
    saveUsers(users);
  }
  return user;
}
function removeFavorite(userId, postId) {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user || !user.favorites) return null;
  user.favorites = user.favorites.filter(pid => pid !== postId);
  saveUsers(users);
  return user;
}

module.exports = {
  getPosts, getPostById, addPost, toggleFavorite,
  getUsers, getUserByUsername, getUserById, addUser,
  addFavorite, removeFavorite
};
