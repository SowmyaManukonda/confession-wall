<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { db } from '$lib/firebase';
  import { 
    collection, 
    addDoc, 
    onSnapshot, 
    doc, 
    updateDoc, 
    increment,
    serverTimestamp 
  } from 'firebase/firestore';

  // State
  let confessions = [];
  let newConfession = '';
  let darkMode = false;
  let filter = 'all';
  let selectedTags = [];
  let showConfirm = false;
  const MAX_CHARS = 300;
  $: charsLeft = MAX_CHARS - newConfession.length;

  const availableTags = ['Love', 'Secret', 'Guilt', 'Funny', 'Advice'];

  // Load confessions in real-time
  onMount(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'confessions'),
      (snapshot) => {
        confessions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());
      }
    );
    return unsubscribe;
  });

  // Filter confessions
  const filteredConfessions = () => {
    let result = [...confessions];
    
    if (filter === 'popular') result = result.filter(c => c.likes > 5);
    if (filter === 'recent') {
      result = result.filter(c => {
        const confessionDate = c.timestamp?.toDate();
        return confessionDate > new Date(Date.now() - 86400000);
      });
    }
    if (selectedTags.length) {
      result = result.filter(c => c.tags?.some(tag => selectedTags.includes(tag)));
    }
    
    return result;
  };

  // Add new confession
  async function addConfession() {
    if (!newConfession.trim()) return;
    
    try {
      await addDoc(collection(db, 'confessions'), {
        text: newConfession,
        likes: 0,
        hasLiked: false,
        tags: selectedTags,
        timestamp: serverTimestamp()
      });
      
      // Reset form
      newConfession = '';
      selectedTags = [];
      showConfirm = false;
    } catch (err) {
      console.error("Error adding confession:", err);
    }
  }

  // Like/unlike confession
  async function likeConfession(id) {
    const confessionRef = doc(db, 'confessions', id);
    const confession = confessions.find(c => c.id === id);
    
    try {
      await updateDoc(confessionRef, {
        likes: confession.hasLiked ? increment(-1) : increment(1),
        hasLiked: !confession.hasLiked
      });
    } catch (err) {
      console.error("Error updating like:", err);
    }
  }

  // Toggle dark mode
  function toggleDarkMode() {
    darkMode = !darkMode;
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }
</script>

<main class:dark-mode={darkMode}>
  <h1>Anonymous Confession Wall</h1>

  <button class="dark-mode-toggle" on:click={toggleDarkMode}>
    {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
  </button>

  <div class="filter-controls">
    <div class="filter-buttons">
      <button class:active={filter === 'all'} on:click={() => filter = 'all'}>All</button>
      <button class:active={filter === 'popular'} on:click={() => filter = 'popular'}>Popular ♥</button>
      <button class:active={filter === 'recent'} on:click={() => filter = 'recent'}>Recent</button>
    </div>

    <div class="tags-container">
      {#each availableTags as tag}
        <button
          class:selected={selectedTags.includes(tag)}
          on:click={() => selectedTags = selectedTags.includes(tag) ? 
            selectedTags.filter(t => t !== tag) : [...selectedTags, tag]}
        >
          {tag}
        </button>
      {/each}
    </div>
  </div>

  <div class="post-form">
    <textarea
      bind:value={newConfession}
      placeholder="Share your secret anonymously..."
      rows="3"
      maxlength={MAX_CHARS}
    ></textarea>
    <div class:warning={charsLeft < 20}>{charsLeft} characters left</div>
    <button on:click={() => showConfirm = true} disabled={!newConfession.trim()}>
      Post
    </button>
  </div>

  {#if showConfirm}
    <div class="confirmation-modal" transition:fade>
      <p>Are you sure you want to post this?</p>
      <div class="confession-preview">{newConfession}</div>
      <div class="modal-buttons">
        <button on:click={addConfession}>Post It</button>
        <button on:click={() => showConfirm = false}>Cancel</button>
      </div>
    </div>
  {/if}

  <div class="confessions-list">
    {#each filteredConfessions() as confession (confession.id)}
      <div class="confession">
        <p>{confession.text}</p>
        
        {#if confession.tags?.length}
          <div class="confession-tags">
            {#each confession.tags as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        {/if}
        
        <div class="meta">
          <span>
            {confession.timestamp?.toDate().toLocaleString() || 'Just now'}
          </span>
          <button 
            on:click={() => likeConfession(confession.id)}
            class:liked={confession.hasLiked}
            class="like-button"
          >
            <span class="heart">{confession.hasLiked ? '❤️' : '🤍'}</span>
            <span class="count">{confession.likes || 0}</span>
          </button>
        </div>
      </div>
    {:else}
      <p class="no-confessions">No confessions found. Be the first to share!</p>
    {/each}
  </div>
</main>

<style>
  :global(.dark-mode) {
    --bg-color: #1a1a1a;
    --text-color: #f0f0f0;
    --card-bg: #2d2d2d;
    --border-color: #444;
    --like-color: #ff4757;
    --like-hover: #ff6b81;
    --tag-color: rgba(255, 71, 87, 0.2);
  }

  :global(:not(.dark-mode)) {
    --bg-color: #ffffff;
    --text-color: #333333;
    --card-bg: #f5f5f5;
    --border-color: #ddd;
    --like-color: #ff4757;
    --like-hover: #ff6b81;
    --tag-color: rgba(255, 71, 87, 0.1);
  }

  main {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: var(--bg-color);
    color: var(--text-color);
    min-height: 100vh;
  }

  .dark-mode-toggle {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 8px 16px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    cursor: pointer;
    z-index: 100;
  }

  .filter-controls {
    margin-bottom: 20px;
  }

  .filter-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .filter-buttons button {
    padding: 8px 16px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    cursor: pointer;
  }

  .filter-buttons button.active {
    background: var(--like-color);
    color: white;
  }

  .tags-container {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tags-container button {
    padding: 6px 12px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 15px;
    cursor: pointer;
  }

  .tags-container button.selected {
    background: var(--like-color);
    color: white;
  }

  .post-form {
    margin-bottom: 20px;
  }

  textarea {
    width: 100%;
    padding: 12px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    margin-bottom: 8px;
    min-height: 100px;
    resize: vertical;
  }

  .warning {
    color: var(--like-color);
    font-size: 0.9em;
  }

  .confessions-list {
    display: grid;
    gap: 16px;
  }

  .confession {
    background: var(--card-bg);
    padding: 16px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .confession-tags {
    display: flex;
    gap: 6px;
    margin: 12px 0;
    flex-wrap: wrap;
  }

  .tag {
    background: var(--tag-color);
    padding: 4px 10px;
    border-radius: 15px;
    font-size: 0.8em;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    font-size: 0.9em;
  }

  .like-button {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 15px;
    transition: all 0.2s;
  }

  .like-button:hover {
    background: rgba(255, 71, 87, 0.1);
  }

  .like-button.liked {
    color: var(--like-color);
  }

  .heart {
    font-size: 1.1em;
    transition: transform 0.2s;
  }

  .like-button:not(.liked):hover .heart {
    transform: scale(1.2);
  }

  .like-button.liked .heart {
    animation: heartBeat 0.6s;
  }

  @keyframes heartBeat {
    0% { transform: scale(1); }
    14% { transform: scale(1.3); }
    28% { transform: scale(1); }
    42% { transform: scale(1.3); }
    70% { transform: scale(1); }
  }

  .confirmation-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--card-bg);
    padding: 24px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    z-index: 1000;
    max-width: 90%;
    width: 400px;
  }

  .modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
  }

  .no-confessions {
    text-align: center;
    padding: 40px;
    opacity: 0.7;
  }
</style>