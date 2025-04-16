"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from '@/components/ui/button';
import Layout from "@/components/Layout";

function CompetitorGallery() {
  const [posts, setPosts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentProfiles, setRecentProfiles] = useState([]);
  const [iframes, setIframes] = useState([]);
  const [profileData, setProfileData] = useState({}); // { username: { website, image, instagram, category } }
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [editProfile, setEditProfile] = useState(null); // username being edited
  const [editName, setEditName] = useState(""); // For editing username
  const [editWebsite, setEditWebsite] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editInstagram, setEditInstagram] = useState("");
  const [editCategory, setEditCategory] = useState("All");
  const categories = ["All", "Pets", "Party", "Plants", "Influencers"];
  const [filterCategory, setFilterCategory] = useState("All");
  const [showWebsitesGrid, setShowWebsitesGrid] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState({}); // { username: true/false }

  // Default fallback image: silhouette of a dog
  const defaultProfileImg = "/dog-silhouette.png";

  // Category color mapping
  const categoryColors = {
    Pets: { bg: "#F2BA7A", text: "#9A5B00", border: "#F2BA7A" },
    Party: { bg: "#EDB4AB", text: "#A65B4A", border: "#EDB4AB" },
    Plants: { bg: "#ADCDA5", text: "#3B6B2A", border: "#ADCDA5" },
    Influencers: { bg: "#7EB8F9", text: "#225B8C", border: "#7EB8F9" },
    All: { bg: "#FBCFE8", text: "#DB2777", border: "#FBCFE8" }
  };

  // Helper to get favicon from a website URL
  const getFaviconUrl = (website) => {
    try {
      if (!website) return "";
      const url = new URL(website);
      return `${url.origin}/favicon.ico`;
    } catch {
      return "";
    }
  };

  // Only render after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Load from localStorage
    const savedPosts = localStorage.getItem("competitor_posts");
    const savedFavs = localStorage.getItem("competitor_favorites");
    const savedProfiles = localStorage.getItem("competitor_profiles");
    const savedProfileData = localStorage.getItem("competitor_profile_data");
    setPosts(savedPosts ? JSON.parse(savedPosts) : [
      { id: 1, image: "/sample1.jpg", username: "competitor1" },
      { id: 2, image: "/sample2.jpg", username: "competitor2" },
    ]);
    setFavorites(savedFavs ? JSON.parse(savedFavs) : []);
    setRecentProfiles(savedProfiles ? JSON.parse(savedProfiles) : []);
    setProfileData(savedProfileData ? JSON.parse(savedProfileData) : {});
  }, []);

  // Persist posts, favorites, profiles, and profileData to localStorage
  useEffect(() => {
    if (mounted) localStorage.setItem("competitor_posts", JSON.stringify(posts));
  }, [posts, mounted]);
  useEffect(() => {
    if (mounted) localStorage.setItem("competitor_favorites", JSON.stringify(favorites));
  }, [favorites, mounted]);
  useEffect(() => {
    if (mounted) localStorage.setItem("competitor_profiles", JSON.stringify(recentProfiles));
  }, [recentProfiles, mounted]);
  useEffect(() => {
    if (mounted) localStorage.setItem("competitor_profile_data", JSON.stringify(profileData));
  }, [profileData, mounted]);

  const handleAddFeed = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    let url = input.trim();
    let username = url;
    if (url.startsWith("http")) {
      const match = url.match(/instagram\.com\/([^/?#]+)/i);
      if (match) username = match[1];
    } else {
      url = `https://${username}`;
    }
    setRecentProfiles((prev) =>
      prev.includes(username) ? prev : [username, ...prev]
    );
    setIframes((prev) =>
      prev.find((item) => item.username === username)
        ? prev
        : [{ username, url }, ...prev]
    );
    setProfileData((prev) =>
      prev[username]
        ? prev
        : { ...prev, [username]: { website: url, image: "", instagram: `https://instagram.com/${username}`, category: "All" } }
    );
    setInput("");
  };

  const handleDeleteProfile = (username) => {
    setRecentProfiles((prev) => prev.filter((u) => u !== username));
    setIframes((prev) => prev.filter((item) => item.username !== username));
    setProfileData((prev) => {
      const copy = { ...prev };
      delete copy[username];
      return copy;
    });
  };

  // Open edit modal
  const openEditProfile = (username) => {
    setEditProfile(username);
    setEditName(username);
    setEditWebsite(profileData[username]?.website || "");
    setEditImage(profileData[username]?.image || "");
    setEditInstagram(profileData[username]?.instagram || `https://instagram.com/${username}`);
    setEditImageFile(null);
    setEditCategory(profileData[username]?.category || "All");
  };

  // Save changes from modal
  const handleSaveProfile = () => {
    // If name changed, update all references
    if (editProfile !== editName && editName.trim()) {
      // Update recentProfiles
      setRecentProfiles((prev) =>
        prev.map((u) => (u === editProfile ? editName : u))
      );
      // Update iframes
      setIframes((prev) =>
        prev.map((item) =>
          item.username === editProfile
            ? { ...item, username: editName }
            : item
        )
      );
      // Update profileData
      setProfileData((prev) => {
        const copy = { ...prev };
        copy[editName] = {
          website: editWebsite,
          image: editImage,
          instagram: editInstagram,
          category: editCategory,
        };
        delete copy[editProfile];
        return copy;
      });
    } else {
      setProfileData((prev) => ({
        ...prev,
        [editProfile]: {
          website: editWebsite,
          image: editImage,
          instagram: editInstagram,
          category: editCategory,
        },
      }));
    }
    setIframes((prev) =>
      prev.map((item) =>
        item.username === editProfile ? { ...item, url: editWebsite } : item
      )
    );
    setEditProfile(null);
    setEditName("");
    setEditWebsite("");
    setEditImage("");
    setEditInstagram("");
    setEditImageFile(null);
    setEditCategory("All");
  };

  // Handle image upload in modal
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEditImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Filtered profiles by category
  const filteredProfiles = filterCategory === "All"
    ? recentProfiles
    : recentProfiles.filter(
        (username) => profileData[username]?.category === filterCategory
      );

  // Filtered iframes for grid (only those with a valid website)
  const filteredIframes = filteredProfiles
    .map((username) => ({
      username,
      url: profileData[username]?.website,
    }))
    .filter((item) => item.url && item.url.startsWith("http"));

  if (!mounted) return null;

  return (
    <div>
      <div className="p-4">
        <Link href="/">
          <Button className="mb-4">← Back to Calendar</Button>
        </Link>
        <h1 className="text-2xl font-bold mb-4">Competitor Instagram Gallery</h1>
        {/* Add competitor feed input box */}
        <form onSubmit={handleAddFeed} className="mb-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste Instagram URL or username"
            className="border border-pink-200 px-3 py-2 rounded-md flex-1 focus:ring-pink-500 focus:border-pink-500"
          />
          <Button type="submit" className="bg-pink-600 hover:bg-pink-500 text-white">
            Add Feed
          </Button>
        </form>
        {/* Category Filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={filterCategory === cat ? "default" : "outline"}
              className={filterCategory === cat ? "bg-pink-600 text-white" : ""}
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </Button>
          ))}
          <Button
            variant={showWebsitesGrid ? "default" : "outline"}
            className={showWebsitesGrid ? "bg-pink-600 text-white" : ""}
            onClick={() => setShowWebsitesGrid((v) => !v)}
          >
            {showWebsitesGrid ? "Hide Websites Grid" : "Show Websites Grid"}
          </Button>
        </div>
        {/* Show recently added profiles as cards */}
        {!showWebsitesGrid && filteredProfiles.length > 0 && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProfiles.map((username) => {
              const website = profileData[username]?.website;
              let image = profileData[username]?.image;
              let favicon = "";
              if (website && website.startsWith("http")) {
                favicon = getFaviconUrl(website);
              }
              const category = profileData[username]?.category || "All";
              const color = categoryColors[category] || categoryColors["All"];
              // Show uploaded image, else favicon, else default
              return (
                <div
                  key={username}
                  className="bg-white border border-pink-200 rounded-xl shadow-md flex flex-col items-center p-4 relative cursor-pointer transition hover:shadow-lg"
                  onClick={() => openEditProfile(username)}
                  tabIndex={0}
                  role="button"
                >
                  {/* Centered profile image */}
                  <div className="flex justify-center w-full">
                    {(image || favicon) && (
                      <img
                        src={image || favicon}
                        alt={username}
                        className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 aspect-square object-cover rounded-full mb-2 border border-pink-200"
                        onError={e => {
                          if (e.target.src !== window.location.origin + defaultProfileImg) {
                            e.target.src = defaultProfileImg;
                          }
                        }}
                      />
                    )}
                    {!image && !favicon && (
                      <img
                        src={defaultProfileImg}
                        alt={username}
                        className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 aspect-square object-cover rounded-full mb-2 border border-pink-200"
                      />
                    )}
                  </div>
                  <span className="font-semibold text-pink-600 text-lg mb-2">@{username}</span>
                  {/* Bottom links row */}
                  <div className="flex justify-between items-center w-full mt-auto pt-2">
                    <a
                      href={`https://instagram.com/${username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-pink-500 underline hover:text-pink-600 text-sm"
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Instagram SVG icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 3.25a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5zm5.13.62a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                      </svg>
                      Instagram
                    </a>
                    {website && website.startsWith("http") ? (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 underline hover:text-pink-600 text-sm"
                        onClick={e => e.stopPropagation()}
                      >
                        Website
                      </a>
                    ) : <span />}
                  </div>
                  <button
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-transparent border-none p-0 m-0"
                    onClick={e => { e.stopPropagation(); handleDeleteProfile(username); }}
                    type="button"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {/* Websites Grid */}
        {showWebsitesGrid && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredIframes.map(({ username, url }) =>
              iframeLoaded[username] !== false ? (
                <div key={username} className="relative border rounded-xl overflow-hidden bg-white shadow-md">
                  <div className="p-2 text-sm font-bold text-pink-600">@{username}</div>
                  <iframe
                    src={url}
                    title={username}
                    width="100%"
                    height="600"
                    className="w-full border-0"
                    style={{ minHeight: 400, background: "#fff" }}
                    onLoad={() =>
                      setIframeLoaded((prev) => ({ ...prev, [username]: true }))
                    }
                    onError={() =>
                      setIframeLoaded((prev) => ({ ...prev, [username]: false }))
                    }
                  />
                </div>
              ) : null
            )}
          </div>
        )}
        {/* Edit Profile Modal */}
        {editProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-pink-500 text-xl"
                onClick={() => setEditProfile(null)}
                aria-label="Close"
                type="button"
              >✕</button>
              {/* Editable name */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-pink-500 mb-1">Competitor Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full border border-pink-200 rounded px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Competitor Name"
                />
              </div>
              <h2 className="text-xl font-bold mb-4 text-pink-600">Edit @{editProfile}</h2>
              <div className="mb-4 flex flex-col items-center">
                {(editImage ||
                  (editWebsite && getFaviconUrl(editWebsite))) ? (
                  <img
                    src={editImage || getFaviconUrl(editWebsite)}
                    alt="Profile"
                    className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 aspect-square object-cover rounded-full border border-pink-200 mb-2"
                    onError={e => {
                      if (e.target.src !== window.location.origin + defaultProfileImg) {
                        e.target.src = defaultProfileImg;
                      }
                    }}
                  />
                ) : (
                  <img
                    src={defaultProfileImg}
                    alt="Profile"
                    className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 aspect-square object-cover rounded-full border border-pink-200 mb-2"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mb-2"
                />
                {/* Add image URL input */}
                <input
                  type="text"
                  value={editImage}
                  onChange={e => setEditImage(e.target.value)}
                  className="w-full border border-pink-200 rounded px-3 py-2 mb-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Paste image URL for profile picture"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-pink-500 mb-1">Website URL</label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={e => setEditWebsite(e.target.value)}
                  className="w-full border border-pink-200 rounded px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="https://example.com"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-pink-500 mb-1">Instagram URL</label>
                <input
                  type="text"
                  value={editInstagram}
                  onChange={e => setEditInstagram(e.target.value)}
                  className="w-full border border-pink-200 rounded px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder={`https://instagram.com/${editProfile}`}
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-pink-500 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full border border-pink-200 rounded px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <Button
                className="bg-pink-600 hover:bg-pink-500 text-white rounded shadow-md w-full"
                onClick={handleSaveProfile}
              >
                Save
              </Button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {iframes.map(({ username, url }) => (
            <div key={username} className="relative border rounded-xl overflow-hidden bg-white shadow-md">
              <div className="p-2 text-sm font-bold text-pink-600">@{username}</div>
              <iframe
                src={url}
                title={username}
                width="100%"
                height="600"
                className="w-full border-0"
                style={{ minHeight: 400, background: "#fff" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Wrap with RootLayout as requested
export default function RootLayout() {
  return (
    <html lang="en">
      <body>
        <Layout>
          <div className="flex">
            {/* Left menu is rendered by Layout */}
            <div className="flex-1">
              <CompetitorGallery />
            </div>
          </div>
        </Layout>
      </body>
    </html>
  );
}