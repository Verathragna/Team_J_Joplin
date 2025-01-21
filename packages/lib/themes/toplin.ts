import { Theme, ThemeAppearance } from './type';

// This is the default theme in Joplin
const theme: Theme = {
    appearance: ThemeAppearance.Light,

    // Color scheme "1" is the basic one, like used to display the note
    // content. It's basically dark gray text on white background
    backgroundColor: '#ffffff',
    backgroundColorTransparent: 'rgba(255,255,255,0.9)',
    oddBackgroundColor: '#eeeeee',
    color: '#000', // For regular text
    colorError: 'red',
    colorCorrect: 'green', // Opposite of colorError
    colorWarn: 'rgb(228,86,0)',
    colorWarnUrl: '#155BDA',
    colorFaded: '#627184', // For less important text
    dividerColor: '#dddddd',
    selectedColor: '#e5e5e5',
    urlColor: '#155BDA',

    // Color scheme "2" is used for the sidebar. It's white text over
    // dark blue background.
    backgroundColor2: '#fff',
    color2: '#ffffff',
    selectedColor2: '#131313',
    colorError2: '#ff6c6c',
    colorWarn2: '#ffcb81',
    colorWarn3: '#ff7626',

    // Color scheme "3" is used for the config screens for example/
    // It's dark text over gray background.
    backgroundColor3: '#fff',
    backgroundColorHover3: '#fff',
    color3: '#627284',

    // Color scheme "4" is used for secondary-style buttons. It makes a white
    // button with blue text.
    backgroundColor4: '#ffffff',
    color4: '#2D6BDC',

    raisedBackgroundColor: '#e5e5e5',
    raisedColor: '#222222',
    searchMarkerBackgroundColor: '#F7D26E',
    searchMarkerColor: 'black',

    warningBackgroundColor: '#FFD08D',
    destructiveColor: '#D00707',

    tableBackgroundColor: 'rgb(247, 247, 247)',
    codeBackgroundColor: 'rgb(243, 243, 243)',
    codeBorderColor: 'rgb(220, 220, 220)',
    codeColor: 'rgb(0,0,0)',

    blockQuoteOpacity: 0.7,

    codeMirrorTheme: 'default',
    codeThemeCss: 'atom-one-light.css',

    headerBackgroundColor: '#F0F0F0',
    textSelectionColor: '#0096FF',
    colorBright2: '#000',

    useNormalization: false,
    titleTextInput: {
        maxWidth: '700px',
        paddingTop: '0.25em',
        paddingBottom: '0.25em',
        marginLeft: 'auto',
        marginRight: 'auto',
        fontFamily: 'Spectral',
        fontSize: '3rem',
        fontWeight: 800,
        borderBottomWidth: '0 important',
        lineHeight: '1.25rem',
    },
    extraRawCss: `@import url('https://fonts.googleapis.com/css?family=Spectral|Spectral+SC');
			@import url('https://fonts.googleapis.com/css2?family=Martel:wght@200;300;400;600;700;800;900&display=swap');
			@import url('https://fonts.googleapis.com/css2?family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap');


			#rendered-md {
				max-width: 700px;
				margin: 0 auto;
				padding: 0 1.5rem;
				font-size: 1rem;
				font-family: PT Serif, Martel, serif;
				line-height: 1.75em
			}

			#rendered-md .header-1,
			#rendered-md .header-2,
			#rendered-md .header-3,
			#rendered-md .header-4,
			#rendered-md .header-5,
			#rendered-md .header-6 {
				margin: 1em 0;
				font-family: Spectral, serif;
				line-height: 1.25em;
				border-bottom: none;
			}

			#rendered-md h1 {
				font-weight: 800;
				font-size: 3em
			}

			#rendered-md h2 {
				font-weight: 400;
				font-size: 1.8em
			}

			#rendered-md h3 {
				font-weight: 600;
				font-size: 1.3em
			}

			#rendered-md h4 {
				font-weight: 600;
				font-size: 1.2em
			}

			#rendered-md h5 {
				font-weight: 600;
				font-size: 1.1em
			}

			#rendered-md h6 {
				font-weight: 600;
				font-size: 1em
			}

			#rendered-md h3,
			#rendered-md h4,
			#rendered-md h5,
			#rendered-md h6 {
				text-transform: uppercase
			}

			#rendered-md li p,
			#rendered-md p,
			#rendered-md pre {
				margin-bottom: 0
			}

			#rendered-md code,
			#rendered-md pre {
				border-radius: 0.5rem;
				color: #fafafa;
				background-color: #212121
			}

			@media print {

				#rendered-md code,
				#rendered-md pre {
					color: #fafafa !important;
					background-color: #212121 !important
				}
			}

			#rendered-md code {
				padding: 0.25rem 0.5rem
			}

			#rendered-md pre {
				padding: 1rem
			}

			#rendered-md pre code {
				padding: 0
			}

			#rendered-md blockquote {
				margin: 2.5em 0;
				padding-left: 2rem;
				padding-right: 2rem;
				border-left: 5px solid #bdbdbd;
				font-size: 1.25em;
				line-height: 1.75em
			}

			#rendered-md hr {
				margin: 4rem auto;
				max-width: 10rem
			}

			#rendered-md a {
				color: #a5171e;
				cursor: pointer
			}

			#rendered-md img {
				max-width: 100%
			}

			#rendered-md b,
			#rendered-md strong {
				font-weight: 800
			}`,
};

export default theme;
