import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../account/AuthProvider'
import { addFanPostReply, createFanPost, listPublicFanPosts, updateFanPostReaction } from './fanPostStore'

const reactionLabels = [
  ['like', 'Like'],
  ['dislike', 'Dislike'],
  ['fire', 'Fire'],
  ['clap', 'Respect'],
]

function getImageDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('')
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function FanPostCard({ onReact, onReply, post, user }) {
  const [replyText, setReplyText] = useState('')
  const created = post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Just now'
  const replies = post.replies ?? []

  const submitReply = async (event) => {
    event.preventDefault()
    const body = replyText.trim()
    if (!body) return
    await onReply(post, body)
    setReplyText('')
  }

  return (
    <article className="network-post-card">
      <div className="network-post-author">
        <span>{(post.userName || 'CF').slice(0, 2).toUpperCase()}</span>
        <div>
          <strong>{post.userName || 'Cricket Fan'}</strong>
          <small>{created}</small>
        </div>
      </div>

      <div className="network-post-copy">
        <h2>{post.data?.title}</h2>
        <p>{post.data?.body}</p>
      </div>

      {post.data?.image && (
        <img className="network-post-image" alt={`${post.data.title} upload`} src={post.data.image} />
      )}

      {post.data?.linkedResult && <p className="network-linked-result">Linked result: {post.data.linkedResult}</p>}

      <div className="network-reactions" aria-label="Post reactions">
        {reactionLabels.map(([type, label]) => {
          const userIds = post.reactions?.[type] ?? []
          const active = user?.uid && userIds.includes(user.uid)
          return (
            <button className={active ? 'active' : ''} key={type} onClick={() => onReact(post, type)} type="button">
              {label} <span>{userIds.length}</span>
            </button>
          )
        })}
      </div>

      <div className="network-replies">
        <span>{replies.length} repl{replies.length === 1 ? 'y' : 'ies'}</span>
        {replies.slice(-3).map((reply) => (
          <div className="network-reply" key={reply.id}>
            <strong>{reply.userName}</strong>
            <p>{reply.body}</p>
          </div>
        ))}
        <form onSubmit={submitReply}>
          <input onChange={(event) => setReplyText(event.target.value)} placeholder="Reply to this post" value={replyText} />
          <button type="submit">Reply</button>
        </form>
      </div>
    </article>
  )
}

export default function NetworkPage() {
  const { openAuthModal, user } = useAuth()
  const [form, setForm] = useState({ title: '', body: '', linkedResult: '' })
  const [image, setImage] = useState('')
  const [imageName, setImageName] = useState('')
  const [posts, setPosts] = useState([])
  const [status, setStatus] = useState('Loading fan posts...')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('create')
  const canPost = Boolean(user && form.title.trim() && form.body.trim())
  const totalReactions = useMemo(() => posts.reduce((total, post) => (
    total + Object.values(post.reactions ?? {}).reduce((sum, userIds) => sum + userIds.length, 0)
  ), 0), [posts])

  const refreshPosts = async () => {
    try {
      const items = await listPublicFanPosts()
      setPosts(items)
      setStatus(items.length ? '' : 'No posts yet. Start the first cricket conversation.')
    } catch (error) {
      setStatus(error?.code === 'permission-denied' ? 'Firestore blocked public fan posts. Check published rules.' : 'Fan posts could not load.')
    }
  }

  useEffect(() => {
    void refreshPosts()
  }, [])

  const updateImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setStatus('Upload an image file.')
      return
    }
    if (file.size > 850000) {
      setStatus('Use an image under 850 KB for now.')
      return
    }
    setImage(await getImageDataUrl(file))
    setImageName(file.name)
    setStatus('')
  }

  const submitPost = async (event) => {
    event.preventDefault()
    if (!user) {
      openAuthModal('signIn')
      return
    }
    if (!canPost) return

    setSaving(true)
    setStatus('')
    try {
      const post = await createFanPost(user, { ...form, image })
      setPosts((current) => [post, ...current])
      setForm({ title: '', body: '', linkedResult: '' })
      setImage('')
      setImageName('')
      setStatus('Posted to the fan network.')
    } catch (error) {
      setStatus(error?.code === 'permission-denied' ? 'Firestore blocked this post. Check published rules.' : 'Post failed.')
    } finally {
      setSaving(false)
    }
  }

  const reactToPost = async (post, reactionType) => {
    if (!user) {
      openAuthModal('signIn')
      return
    }
    const updated = await updateFanPostReaction(post, user, reactionType)
    setPosts((current) => current.map((item) => (item.id === updated.id ? updated : item)))
  }

  const replyToPost = async (post, body) => {
    if (!user) {
      openAuthModal('signIn')
      return
    }
    const updated = await addFanPostReply(post, user, body)
    setPosts((current) => current.map((item) => (item.id === updated.id ? updated : item)))
  }

  return (
    <section className="network-page pointer-reactive">
      <div className="network-hero">
        <div>
          <span>Fan Network</span>
          <h1>Post reactions, predictions, and cricket takes.</h1>
          <p>Create public fan posts, attach images, react to other users, and build reply threads around IPL moments.</p>
        </div>
        <div className="network-stats">
          <div><strong>{posts.length}</strong><span>Posts</span></div>
          <div><strong>{totalReactions}</strong><span>Reactions</span></div>
        </div>
      </div>

      <div className="network-tabs" aria-label="Network views">
        <button className={activeTab === 'create' ? 'active' : ''} onClick={() => setActiveTab('create')} type="button">
          Create Post
        </button>
        <button className={activeTab === 'feed' ? 'active' : ''} onClick={() => setActiveTab('feed')} type="button">
          View Other Posts
        </button>
      </div>

      <div className="network-layout">
        {activeTab === 'create' ? (
          <form className="network-composer" onSubmit={submitPost}>
            <span>Create Post</span>
            <input onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Post title" value={form.title} />
            <textarea onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} placeholder="Share a match reaction, auction strategy, prediction, or player opinion" rows={5} value={form.body} />
            <input onChange={(event) => setForm((current) => ({ ...current, linkedResult: event.target.value }))} placeholder="Optional linked saved result or context" value={form.linkedResult} />
            <label className="network-upload">
              <span>Choose Image</span>
              <small>{imageName || 'PNG, JPG, or WebP under 850 KB'}</small>
              <input accept="image/*" onChange={updateImage} type="file" />
            </label>
            {image && (
              <div className="network-image-preview">
                <img alt="Post upload preview" src={image} />
                <button onClick={() => { setImage(''); setImageName('') }} type="button">Remove Image</button>
              </div>
            )}
            <button disabled={saving || (user && !canPost)} type="submit">{saving ? 'Posting...' : user ? 'Publish Post' : 'Sign In to Post'}</button>
            {status && <p className="network-status">{status}</p>}
          </form>
        ) : (
          <div className="network-feed">
            {status && !posts.length && <p className="network-status">{status}</p>}
            {posts.map((post) => (
              <FanPostCard key={post.id} onReact={reactToPost} onReply={replyToPost} post={post} user={user} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
