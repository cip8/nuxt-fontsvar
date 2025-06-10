export default function VariableFontsDemo() {
  const [selectedFont, setSelectedFont] = useState('montserrat')
  const [weight, setWeight] = useState(400)
  const [isItalic, setIsItalic] = useState(false)
  const [fillLevel, setFillLevel] = useState(0)
  const [iconWeight, setIconWeight] = useState(400)
  const [iconSize, setIconSize] = useState(24)
  const [isAnimating, setIsAnimating] = useState(false)

  // Simulate the useVariableFonts composable behavior
  const fonts = {
    families: [
      { name: 'Montserrat', cssVariable: '--font-montserrat', isVariable: true },
      { name: 'Lora', cssVariable: '--font-lora', isVariable: true },
      { name: 'Playfair Display', cssVariable: '--font-playfair-display', isVariable: true },
      { name: 'JetBrains Mono', cssVariable: '--font-jetbrains-mono', isVariable: true }
    ]
  }

  const demoTextRef = useRef(null)

  const animateWeight = () => {
    if (!demoTextRef.current) return
    setIsAnimating(true)

    let start = 100
    let end = 900
    let current = start
    let direction = 1

    const animate = () => {
      current += direction * 10
      if (current >= end || current <= start) {
        direction *= -1
      }

      if (demoTextRef.current) {
        demoTextRef.current.style.fontWeight = current
        demoTextRef.current.style.fontVariationSettings = `'wght' ${current}`
      }

      if (current !== start || direction !== -1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        setWeight(400)
      }
    }

    requestAnimationFrame(animate)
  }

  const fontStyles = {
    fontFamily: `var(${fonts.families.find(f => f.name.toLowerCase().includes(selectedFont))?.cssVariable})`,
    fontWeight: weight,
    fontStyle: isItalic ? 'italic' : 'normal',
    fontVariationSettings: `'wght' ${weight}`,
    transition: 'font-weight 0.3s ease'
  }

  const iconStyles = {
    fontFamily: 'var(--font-material-symbols-rounded)',
    fontSize: `${iconSize}px`,
    fontVariationSettings: `'FILL' ${fillLevel}, 'wght' ${iconWeight}, 'GRAD' 0, 'opsz' ${iconSize}`
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <header className="text-center space-y-4">
        <h1
          className="text-5xl font-bold"
          style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700 }}
        >
          Variable Fonts Demo
        </h1>
        <p
          className="text-lg text-gray-600"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          Explore the power of variable fonts in your Nuxt application
        </p>
      </header>

      {/* Font Playground */}
      <section className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'var(--font-montserrat)' }}>
          Interactive Font Playground
        </h2>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium mb-2">Font Family</label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="montserrat">Montserrat</option>
              <option value="lora">Lora</option>
              <option value="playfair">Playfair Display</option>
              <option value="jetbrains">JetBrains Mono</option>
            </select>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Weight: {weight}
            </label>
            <input
              type="range"
              min="100"
              max="900"
              step="10"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium mb-2">Style</label>
            <button
              onClick={() => setIsItalic(!isItalic)}
              className={`px-4 py-2 rounded-md transition-colors ${
                isItalic
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Italic
            </button>
          </div>

          {/* Animation */}
          <div>
            <label className="block text-sm font-medium mb-2">Animation</label>
            <button
              onClick={animateWeight}
              disabled={isAnimating}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
            >
              {isAnimating ? 'Animating...' : 'Animate Weight'}
            </button>
          </div>
        </div>

        {/* Demo Text */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <p
            ref={demoTextRef}
            style={fontStyles}
            className="text-2xl leading-relaxed"
          >
            The quick brown fox jumps over the lazy dog. 0123456789
          </p>
          <p
            style={{ ...fontStyles, fontSize: '16px' }}
            className="mt-4 text-gray-600"
          >
            Variable fonts allow for infinite variations between their minimum and maximum values,
            creating smooth transitions and reducing file sizes.
          </p>
        </div>

        {/* CSS Output */}
        <div className="mt-4 p-4 bg-gray-900 text-green-400 rounded-md font-mono text-sm">
          <div>font-family: var({fonts.families.find(f => f.name.toLowerCase().includes(selectedFont))?.cssVariable});</div>
          <div>font-weight: {weight};</div>
          <div>font-style: {isItalic ? 'italic' : 'normal'};</div>
          <div>font-variation-settings: 'wght' {weight};</div>
        </div>
      </section>

      {/* Material Icons Demo */}
      <section className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'var(--font-montserrat)' }}>
          Material Symbols Variable Icons
        </h2>

        {/* Icon Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Fill: {fillLevel}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={fillLevel}
              onChange={(e) => setFillLevel(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Weight: {iconWeight}
            </label>
            <input
              type="range"
              min="100"
              max="700"
              step="100"
              value={iconWeight}
              onChange={(e) => setIconWeight(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Size: {iconSize}px
            </label>
            <input
              type="range"
              min="20"
              max="48"
              step="4"
              value={iconSize}
              onChange={(e) => setIconSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Icon Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 mt-6">
          {['home', 'favorite', 'search', 'settings', 'delete', 'star', 'menu', 'close',
            'add', 'remove', 'check', 'edit', 'save', 'download', 'upload', 'share'].map(icon => (
            <div key={icon} className="text-center">
              <span
                style={iconStyles}
                className="material-symbols-rounded block mb-2"
              >
                {icon}
              </span>
              <span className="text-xs text-gray-500">{icon}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Typography Examples */}
      <section className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'var(--font-montserrat)' }}>
          Typography Examples
        </h2>

        <div className="space-y-8">
          {/* Montserrat Example */}
          <div>
            <h3
              className="text-xl mb-2"
              style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700 }}
            >
              Montserrat - Modern Sans Serif
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[300, 400, 700].map(w => (
                <div key={w}>
                  <p
                    style={{
                      fontFamily: 'var(--font-montserrat)',
                      fontWeight: w,
                      fontVariationSettings: `'wght' ${w}`
                    }}
                  >
                    Weight {w}: The quick brown fox jumps over the lazy dog
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Lora Example */}
          <div>
            <h3
              className="text-xl mb-2"
              style={{ fontFamily: 'var(--font-lora)', fontWeight: 600 }}
            >
              Lora - Elegant Serif
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-lora)',
                fontWeight: 400,
                lineHeight: 1.7
              }}
              className="text-gray-700"
            >
              Lora is a well-balanced contemporary serif with roots in calligraphy.
              It's perfect for body text and pairs beautifully with sans-serif headings.
              The variable font version allows for smooth weight transitions from 400 to 700.
            </p>
          </div>

          {/* Code Example */}
          <div>
            <h3
              className="text-xl mb-2"
              style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}
            >
              JetBrains Mono - Code
            </h3>
            <pre
              style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 400 }}
              className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto"
            >
{`// Using variable fonts in Vue
const { $fonts } = useNuxtApp()

// Apply font to element
$fonts.applyFont(element, {
  family: 'montserrat',
  weight: 600,
  variationSettings: { wght: 650 }
})`}
            </pre>
          </div>
        </div>
      </section>

      {/* Performance Tips */}
      <section className="bg-blue-50 rounded-lg p-8">
        <h2
          className="text-2xl font-semibold mb-4"
          style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 600 }}
        >
          Performance Tips
        </h2>
        <ul className="space-y-2 text-gray-700" style={{ fontFamily: 'var(--font-montserrat)' }}>
          <li className="flex items-start">
            <span className="material-symbols-rounded mr-2 text-blue-500" style={iconStyles}>
              check_circle
            </span>
            Variable fonts reduce file size by combining multiple weights in a single file
          </li>
          <li className="flex items-start">
            <span className="material-symbols-rounded mr-2 text-blue-500" style={iconStyles}>
              check_circle
            </span>
            Preload critical fonts to improve First Contentful Paint (FCP)
          </li>
          <li className="flex items-start">
            <span className="material-symbols-rounded mr-2 text-blue-500" style={iconStyles}>
              check_circle
            </span>
            Use font-display: swap to prevent invisible text during load
          </li>
          <li className="flex items-start">
            <span className="material-symbols-rounded mr-2 text-blue-500" style={iconStyles}>
              check_circle
            </span>
            Subset fonts to include only the characters you need
          </li>
        </ul>
      </section>
    </div>
  )
}
