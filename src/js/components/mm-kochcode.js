const fragmentShaderSource = `
  // fragment shaders don't have a default precision so we need
  // to pick one. mediump is a good default
  precision highp float;
  uniform vec4 u_color;
  void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting
    gl_FragColor = u_color; // return redish-purple
  }`
const vertexShaderSource = `
  attribute vec2 a_position;
  uniform vec4 u_color;
  uniform vec2 u_resolution;
  
  void main() {
    // convert the position from pixels to 0.0 to 1.0
    vec2 zeroToOne = a_position / u_resolution;
  
    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;
  
    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;
  
    gl_Position = vec4(clipSpace, 0, 1);
  }
  `;

const paletteHex = [
    ['#69d2e7', '#a7dbd8', '#e0e4cc', '#f38630', '#fa6900'],
    ['#fe4365', '#fc9d9a', '#f9cdad', '#c8c8a9', '#83af9b'],
    ['#ecd078', '#d95b43', '#c02942', '#542437', '#53777a'],
    ['#556270', '#4ecdc4', '#c7f464', '#ff6b6b', '#c44d58'],
    ['#774f38', '#e08e79', '#f1d4af', '#ece5ce', '#c5e0dc'],
    ['#e8ddcb', '#cdb380', '#036564', '#033649', '#031634'],
    ['#490a3d', '#bd1550', '#e97f02', '#f8ca00', '#8a9b0f'],
    ['#594f4f', '#547980', '#45ada8', '#9de0ad', '#e5fcc2'],
    ['#00a0b0', '#6a4a3c', '#cc333f', '#eb6841', '#edc951'],
    ['#e94e77', '#d68189', '#c6a49a', '#c6e5d9', '#f4ead5'],
    ['#3fb8af', '#7fc7af', '#dad8a7', '#ff9e9d', '#ff3d7f'],
    ['#d9ceb2', '#948c75', '#d5ded9', '#7a6a53', '#99b2b7'],
    ['#ffffff', '#cbe86b', '#f2e9e1', '#1c140d', '#cbe86b'],
    ['#efffcd', '#dce9be', '#555152', '#2e2633', '#99173c'],
    ['#343838', '#005f6b', '#008c9e', '#00b4cc', '#00dffc'],
    ['#413e4a', '#73626e', '#b38184', '#f0b49e', '#f7e4be'],
    ['#ff4e50', '#fc913a', '#f9d423', '#ede574', '#e1f5c4'],
    ['#99b898', '#fecea8', '#ff847c', '#e84a5f', '#2a363b'],
    ['#655643', '#80bca3', '#f6f7bd', '#e6ac27', '#bf4d28'],
    ['#00a8c6', '#40c0cb', '#f9f2e7', '#aee239', '#8fbe00'],
    ['#351330', '#424254', '#64908a', '#e8caa4', '#cc2a41'],
    ['#554236', '#f77825', '#d3ce3d', '#f1efa5', '#60b99a'],
    ['#ff9900', '#424242', '#e9e9e9', '#bcbcbc', '#3299bb'],
    ['#5d4157', '#838689', '#a8caba', '#cad7b2', '#ebe3aa'],
    ['#8c2318', '#5e8c6a', '#88a65e', '#bfb35a', '#f2c45a'],
    ['#fad089', '#ff9c5b', '#f5634a', '#ed303c', '#3b8183'],
    ['#ff4242', '#f4fad2', '#d4ee5e', '#e1edb9', '#f0f2eb'],
    ['#d1e751', '#ffffff', '#000000', '#4dbce9', '#26ade4'],
    ['#f8b195', '#f67280', '#c06c84', '#6c5b7b', '#355c7d'],
    ['#1b676b', '#519548', '#88c425', '#bef202', '#eafde6'],
    ['#bcbdac', '#cfbe27', '#f27435', '#f02475', '#3b2d38'],
    ['#5e412f', '#fcebb6', '#78c0a8', '#f07818', '#f0a830'],
    ['#452632', '#91204d', '#e4844a', '#e8bf56', '#e2f7ce'],
    ['#eee6ab', '#c5bc8e', '#696758', '#45484b', '#36393b'],
    ['#f0d8a8', '#3d1c00', '#86b8b1', '#f2d694', '#fa2a00'],
    ['#f04155', '#ff823a', '#f2f26f', '#fff7bd', '#95cfb7'],
    ['#2a044a', '#0b2e59', '#0d6759', '#7ab317', '#a0c55f'],
    ['#bbbb88', '#ccc68d', '#eedd99', '#eec290', '#eeaa88'],
    ['#b9d7d9', '#668284', '#2a2829', '#493736', '#7b3b3b'],
    ['#b3cc57', '#ecf081', '#ffbe40', '#ef746f', '#ab3e5b'],
    ['#a3a948', '#edb92e', '#f85931', '#ce1836', '#009989'],
    ['#67917a', '#170409', '#b8af03', '#ccbf82', '#e33258'],
    ['#e8d5b7', '#0e2430', '#fc3a51', '#f5b349', '#e8d5b9'],
    ['#aab3ab', '#c4cbb7', '#ebefc9', '#eee0b7', '#e8caaf'],
    ['#300030', '#480048', '#601848', '#c04848', '#f07241'],
    ['#ab526b', '#bca297', '#c5ceae', '#f0e2a4', '#f4ebc3'],
    ['#607848', '#789048', '#c0d860', '#f0f0d8', '#604848'],
    ['#a8e6ce', '#dcedc2', '#ffd3b5', '#ffaaa6', '#ff8c94'],
    ['#3e4147', '#fffedf', '#dfba69', '#5a2e2e', '#2a2c31'],
    ['#b6d8c0', '#c8d9bf', '#dadabd', '#ecdbbc', '#fedcba'],
    ['#fc354c', '#29221f', '#13747d', '#0abfbc', '#fcf7c5'],
    ['#1c2130', '#028f76', '#b3e099', '#ffeaad', '#d14334'],
    ['#edebe6', '#d6e1c7', '#94c7b6', '#403b33', '#d3643b'],
    ['#cc0c39', '#e6781e', '#c8cf02', '#f8fcc1', '#1693a7'],
    ['#dad6ca', '#1bb0ce', '#4f8699', '#6a5e72', '#563444'],
    ['#a7c5bd', '#e5ddcb', '#eb7b59', '#cf4647', '#524656'],
    ['#fdf1cc', '#c6d6b8', '#987f69', '#e3ad40', '#fcd036'],
    ['#5c323e', '#a82743', '#e15e32', '#c0d23e', '#e5f04c'],
    ['#230f2b', '#f21d41', '#ebebbc', '#bce3c5', '#82b3ae'],
    ['#b9d3b0', '#81bda4', '#b28774', '#f88f79', '#f6aa93'],
    ['#3a111c', '#574951', '#83988e', '#bcdea5', '#e6f9bc'],
    ['#5e3929', '#cd8c52', '#b7d1a3', '#dee8be', '#fcf7d3'],
    ['#1c0113', '#6b0103', '#a30006', '#c21a01', '#f03c02'],
    ['#382f32', '#ffeaf2', '#fcd9e5', '#fbc5d8', '#f1396d'],
    ['#e3dfba', '#c8d6bf', '#93ccc6', '#6cbdb5', '#1a1f1e'],
    ['#000000', '#9f111b', '#b11623', '#292c37', '#cccccc'],
    ['#c1b398', '#605951', '#fbeec2', '#61a6ab', '#accec0'],
    ['#8dccad', '#988864', '#fea6a2', '#f9d6ac', '#ffe9af'],
    ['#f6f6f6', '#e8e8e8', '#333333', '#990100', '#b90504'],
    ['#1b325f', '#9cc4e4', '#e9f2f9', '#3a89c9', '#f26c4f'],
    ['#5e9fa3', '#dcd1b4', '#fab87f', '#f87e7b', '#b05574'],
    ['#951f2b', '#f5f4d7', '#e0dfb1', '#a5a36c', '#535233'],
    ['#413d3d', '#040004', '#c8ff00', '#fa023c', '#4b000f'],
    ['#eff3cd', '#b2d5ba', '#61ada0', '#248f8d', '#605063'],
    ['#2d2d29', '#215a6d', '#3ca2a2', '#92c7a3', '#dfece6'],
    ['#cfffdd', '#b4dec1', '#5c5863', '#a85163', '#ff1f4c'],
    ['#4e395d', '#827085', '#8ebe94', '#ccfc8e', '#dc5b3e'],
    ['#9dc9ac', '#fffec7', '#f56218', '#ff9d2e', '#919167'],
    ['#a1dbb2', '#fee5ad', '#faca66', '#f7a541', '#f45d4c'],
    ['#ffefd3', '#fffee4', '#d0ecea', '#9fd6d2', '#8b7a5e'],
    ['#a8a7a7', '#cc527a', '#e8175d', '#474747', '#363636'],
    ['#ffedbf', '#f7803c', '#f54828', '#2e0d23', '#f8e4c1'],
    ['#f8edd1', '#d88a8a', '#474843', '#9d9d93', '#c5cfc6'],
    ['#f38a8a', '#55443d', '#a0cab5', '#cde9ca', '#f1edd0'],
    ['#4e4d4a', '#353432', '#94ba65', '#2790b0', '#2b4e72'],
    ['#0ca5b0', '#4e3f30', '#fefeeb', '#f8f4e4', '#a5b3aa'],
    ['#a70267', '#f10c49', '#fb6b41', '#f6d86b', '#339194'],
    ['#9d7e79', '#ccac95', '#9a947c', '#748b83', '#5b756c'],
    ['#edf6ee', '#d1c089', '#b3204d', '#412e28', '#151101'],
    ['#046d8b', '#309292', '#2fb8ac', '#93a42a', '#ecbe13'],
    ['#4d3b3b', '#de6262', '#ffb88c', '#ffd0b3', '#f5e0d3'],
    ['#fffbb7', '#a6f6af', '#66b6ab', '#5b7c8d', '#4f2958'],
    ['#ff003c', '#ff8a00', '#fabe28', '#88c100', '#00c176'],
    ['#fcfef5', '#e9ffe1', '#cdcfb7', '#d6e6c3', '#fafbe3'],
    ['#9cddc8', '#bfd8ad', '#ddd9ab', '#f7af63', '#633d2e'],
    ['#30261c', '#403831', '#36544f', '#1f5f61', '#0b8185'],
    ['#d1313d', '#e5625c', '#f9bf76', '#8eb2c5', '#615375'],
    ['#ffe181', '#eee9e5', '#fad3b2', '#ffba7f', '#ff9c97'],
    ['#aaff00', '#ffaa00', '#ff00aa', '#aa00ff', '#00aaff'],
    ['#c2412d', '#d1aa34', '#a7a844', '#a46583', '#5a1e4a'],
    ['#75616b', '#bfcff7', '#dce4f7', '#f8f3bf', '#d34017'],
    ['#805841', '#dcf7f3', '#fffcdd', '#ffd8d8', '#f5a2a2'],
    ['#379f7a', '#78ae62', '#bbb749', '#e0fbac', '#1f1c0d'],
    ['#73c8a9', '#dee1b6', '#e1b866', '#bd5532', '#373b44'],
    ['#caff42', '#ebf7f8', '#d0e0eb', '#88abc2', '#49708a'],
    ['#7e5686', '#a5aad9', '#e8f9a2', '#f8a13f', '#ba3c3d'],
    ['#82837e', '#94b053', '#bdeb07', '#bffa37', '#e0e0e0'],
    ['#111625', '#341931', '#571b3c', '#7a1e48', '#9d2053'],
    ['#312736', '#d4838f', '#d6abb1', '#d9d9d9', '#c4ffeb'],
    ['#84b295', '#eccf8d', '#bb8138', '#ac2005', '#2c1507'],
    ['#395a4f', '#432330', '#853c43', '#f25c5e', '#ffa566'],
    ['#fde6bd', '#a1c5ab', '#f4dd51', '#d11e48', '#632f53'],
    ['#6da67a', '#77b885', '#86c28b', '#859987', '#4a4857'],
    ['#bed6c7', '#adc0b4', '#8a7e66', '#a79b83', '#bbb2a1'],
    ['#058789', '#503d2e', '#d54b1a', '#e3a72f', '#f0ecc9'],
    ['#e21b5a', '#9e0c39', '#333333', '#fbffe3', '#83a300'],
    ['#261c21', '#6e1e62', '#b0254f', '#de4126', '#eb9605'],
    ['#b5ac01', '#ecba09', '#e86e1c', '#d41e45', '#1b1521'],
    ['#efd9b4', '#d6a692', '#a39081', '#4d6160', '#292522'],
    ['#fbc599', '#cdbb93', '#9eae8a', '#335650', '#f35f55'],
    ['#c75233', '#c78933', '#d6ceaa', '#79b5ac', '#5e2f46'],
    ['#793a57', '#4d3339', '#8c873e', '#d1c5a5', '#a38a5f'],
    ['#f2e3c6', '#ffc6a5', '#e6324b', '#2b2b2b', '#353634'],
    ['#512b52', '#635274', '#7bb0a8', '#a7dbab', '#e4f5b1'],
    ['#59b390', '#f0ddaa', '#e47c5d', '#e32d40', '#152b3c'],
    ['#fdffd9', '#fff0b8', '#ffd6a3', '#faad8e', '#142f30'],
    ['#11766d', '#410936', '#a40b54', '#e46f0a', '#f0b300'],
    ['#11644d', '#a0b046', '#f2c94e', '#f78145', '#f24e4e'],
    ['#c7fcd7', '#d9d5a7', '#d9ab91', '#e6867a', '#ed4a6a'],
    ['#595643', '#4e6b66', '#ed834e', '#ebcc6e', '#ebe1c5'],
    ['#331327', '#991766', '#d90f5a', '#f34739', '#ff6e27'],
    ['#bf496a', '#b39c82', '#b8c99d', '#f0d399', '#595151'],
    ['#f1396d', '#fd6081', '#f3ffeb', '#acc95f', '#8f9924'],
    ['#efeecc', '#fe8b05', '#fe0557', '#400403', '#0aabba'],
    ['#e5eaa4', '#a8c4a2', '#69a5a4', '#616382', '#66245b'],
    ['#e9e0d1', '#91a398', '#33605a', '#070001', '#68462b'],
    ['#e4ded0', '#abccbd', '#7dbeb8', '#181619', '#e32f21'],
    ['#e0eff1', '#7db4b5', '#ffffff', '#680148', '#000000'],
    ['#b7cbbf', '#8c886f', '#f9a799', '#f4bfad', '#f5dabd'],
    ['#ffb884', '#f5df98', '#fff8d4', '#c0d1c2', '#2e4347'],
    ['#6da67a', '#99a66d', '#a9bd68', '#b5cc6a', '#c0de5d'],
    ['#b1e6d1', '#77b1a9', '#3d7b80', '#270a33', '#451a3e'],
    ['#fc284f', '#ff824a', '#fea887', '#f6e7f7', '#d1d0d7'],
    ['#ffab07', '#e9d558', '#72ad75', '#0e8d94', '#434d53'],
    ['#311d39', '#67434f', '#9b8e7e', '#c3ccaf', '#a51a41'],
    ['#5cacc4', '#8cd19d', '#cee879', '#fcb653', '#ff5254'],
    ['#44749d', '#c6d4e1', '#ffffff', '#ebe7e0', '#bdb8ad'],
    ['#cfb590', '#9e9a41', '#758918', '#564334', '#49281f'],
    ['#e4e4c5', '#b9d48b', '#8d2036', '#ce0a31', '#d3e4c5'],
    ['#ccf390', '#e0e05a', '#f7c41f', '#fc930a', '#ff003d'],
    ['#807462', '#a69785', '#b8faff', '#e8fdff', '#665c49'],
    ['#ec4401', '#cc9b25', '#13cd4a', '#7b6ed6', '#5e525c'],
    ['#cc5d4c', '#fffec6', '#c7d1af', '#96b49c', '#5b5847'],
    ['#e3e8cd', '#bcd8bf', '#d3b9a3', '#ee9c92', '#fe857e'],
    ['#360745', '#d61c59', '#e7d84b', '#efeac5', '#1b8798'],
    ['#2b222c', '#5e4352', '#965d62', '#c7956d', '#f2d974'],
    ['#e7edea', '#ffc52c', '#fb0c06', '#030d4f', '#ceecef'],
    ['#eb9c4d', '#f2d680', '#f3ffcf', '#bac9a9', '#697060'],
    ['#fff3db', '#e7e4d5', '#d3c8b4', '#c84648', '#703e3b'],
    ['#f5dd9d', '#bcc499', '#92a68a', '#7b8f8a', '#506266'],
    ['#f2e8c4', '#98d9b6', '#3ec9a7', '#2b879e', '#616668'],
    ['#041122', '#259073', '#7fda89', '#c8e98e', '#e6f99d'],
    ['#c6cca5', '#8ab8a8', '#6b9997', '#54787d', '#615145'],
    ['#4b1139', '#3b4058', '#2a6e78', '#7a907c', '#c9b180'],
    ['#8d7966', '#a8a39d', '#d8c8b8', '#e2ddd9', '#f8f1e9'],
    ['#2d1b33', '#f36a71', '#ee887a', '#e4e391', '#9abc8a'],
    ['#95a131', '#c8cd3b', '#f6f1de', '#f5b9ae', '#ee0b5b'],
    ['#79254a', '#795c64', '#79927d', '#aeb18e', '#e3cf9e'],
    ['#429398', '#6b5d4d', '#b0a18f', '#dfcdb4', '#fbeed3'],
    ['#1d1313', '#24b694', '#d22042', '#a3b808', '#30c4c9'],
    ['#9d9e94', '#c99e93', '#f59d92', '#e5b8ad', '#d5d2c8'],
    ['#f0ffc9', '#a9da88', '#62997a', '#72243d', '#3b0819'],
    ['#322938', '#89a194', '#cfc89a', '#cc883a', '#a14016'],
    ['#452e3c', '#ff3d5a', '#ffb969', '#eaf27e', '#3b8c88'],
    ['#f06d61', '#da825f', '#c4975c', '#a8ab7b', '#8cbf99'],
    ['#540045', '#c60052', '#ff714b', '#eaff87', '#acffe9'],
    ['#2b2726', '#0a516d', '#018790', '#7dad93', '#bacca4'],
    ['#027b7f', '#ffa588', '#d62957', '#bf1e62', '#572e4f'],
    ['#23192d', '#fd0a54', '#f57576', '#febf97', '#f5ecb7'],
    ['#fa6a64', '#7a4e48', '#4a4031', '#f6e2bb', '#9ec6b8'],
    ['#a3c68c', '#879676', '#6e6662', '#4f364a', '#340735'],
    ['#f6d76b', '#ff9036', '#d6254d', '#ff5475', '#fdeba9'],
    ['#80a8a8', '#909d9e', '#a88c8c', '#ff0d51', '#7a8c89'],
    ['#a32c28', '#1c090b', '#384030', '#7b8055', '#bca875'],
    ['#6d9788', '#1e2528', '#7e1c13', '#bf0a0d', '#e6e1c2'],
    ['#373737', '#8db986', '#acce91', '#badb73', '#efeae4'],
    ['#280904', '#680e34', '#9a151a', '#c21b12', '#fc4b2a'],
    ['#fb6900', '#f63700', '#004853', '#007e80', '#00b9bd'],
    ['#e6b39a', '#e6cba5', '#ede3b4', '#8b9e9b', '#6d7578'],
    ['#641f5e', '#676077', '#65ac92', '#c2c092', '#edd48e'],
    ['#a69e80', '#e0ba9b', '#e7a97e', '#d28574', '#3b1922'],
    ['#161616', '#c94d65', '#e7c049', '#92b35a', '#1f6764'],
    ['#234d20', '#36802d', '#77ab59', '#c9df8a', '#f0f7da'],
    ['#4b3e4d', '#1e8c93', '#dbd8a2', '#c4ac30', '#d74f33'],
    ['#ff7474', '#f59b71', '#c7c77f', '#e0e0a8', '#f1f1c1'],
    ['#e6eba9', '#abbb9f', '#6f8b94', '#706482', '#703d6f'],
    ['#26251c', '#eb0a44', '#f2643d', '#f2a73d', '#a0e8b7'],
    ['#fdcfbf', '#feb89f', '#e23d75', '#5f0d3b', '#742365'],
    ['#230b00', '#a29d7f', '#d4cfa5', '#f8ecd4', '#aabe9b'],
    ['#85847e', '#ab6a6e', '#f7345b', '#353130', '#cbcfb4'],
    ['#d4f7dc', '#dbe7b4', '#dbc092', '#e0846d', '#f51441'],
    ['#d3d5b0', '#b5cea4', '#9dc19d', '#8c7c62', '#71443f'],
    ['#4f364c', '#5e405f', '#6b6b6b', '#8f9e6f', '#b1cf72'],
    ['#bfcdb4', '#f7e5bf', '#ead2a4', '#efb198', '#7d5d4e'],
    ['#6f5846', '#a95a52', '#e35b5d', '#f18052', '#ffa446'],
    ['#ff3366', '#c74066', '#8f4d65', '#575a65', '#1f6764'],
    ['#ffff99', '#d9cc8c', '#b39980', '#8c6673', '#663366'],
    ['#c46564', '#f0e999', '#b8c99d', '#9b726f', '#eeb15b'],
    ['#eeda95', '#b7c27e', '#9a927b', '#8a6a6b', '#805566'],
    ['#62a07b', '#4f8b89', '#536c8d', '#5c4f79', '#613860'],
    ['#1a081f', '#4d1d4d', '#05676e', '#489c79', '#ebc288'],
    ['#f0f0d8', '#b4debe', '#77cca4', '#666666', '#b4df37'],
    ['#ed6464', '#bf6370', '#87586c', '#574759', '#1a1b1c'],
    ['#ccb24c', '#f7d683', '#fffdc0', '#fffffd', '#457d97'],
    ['#7a5b3e', '#fafafa', '#fa4b00', '#cdbdae', '#1f1f1f'],
    ['#566965', '#948a71', '#cc9476', '#f2a176', '#ff7373'],
    ['#d31900', '#ff6600', '#fff2af', '#7cb490', '#000000'],
    ['#d24858', '#ea8676', '#eab05e', '#fdeecd', '#493831'],
    ['#ebeaa9', '#ebc588', '#7d2948', '#3b0032', '#0e0b29'],
    ['#411f2d', '#ac4147', '#f88863', '#ffc27f', '#ffe29a'],
    ['#e7e79d', '#c0d890', '#78a890', '#606078', '#d8a878'],
    ['#9dbcbc', '#f0f0af', '#ff370f', '#332717', '#6bacbf'],
    ['#063940', '#195e63', '#3e838c', '#8ebdb6', '#ece1c3'],
    ['#e8c382', '#b39d69', '#a86b4c', '#7d1a0c', '#340a0b'],
    ['#94654c', '#f89fa1', '#fabdbd', '#fad6d6', '#fefcd0'],
    ['#595b5a', '#14c3a2', '#0de5a8', '#7cf49a', '#b8fd99'],
    ['#cddbc2', '#f7e4c6', '#fb9274', '#f5565b', '#875346'],
    ['#f0ddbd', '#ba3622', '#851e25', '#520c30', '#1c997f'],
    ['#312c20', '#494d4b', '#7c7052', '#b3a176', '#e2cb92'],
    ['#e7dd96', '#e16639', '#ad860a', '#b7023f', '#55024a'],
    ['#574c41', '#e36b6b', '#e3a56b', '#e3c77b', '#96875a'],
    ['#3f2c26', '#dd423e', '#a2a384', '#eac388', '#c5ad4b'],
    ['#0a0310', '#49007e', '#ff005b', '#ff7d10', '#ffb238'],
    ['#cdeccc', '#edd269', '#e88460', '#f23460', '#321d2e'],
    ['#1f1f20', '#2b4c7e', '#567ebb', '#606d80', '#dce0e6'],
    ['#f3e7d7', '#f7d7cd', '#f8c7c9', '#e0c0c7', '#c7b9c5'],
    ['#ecbe13', '#738c79', '#6a6b5f', '#2c2b26', '#a43955'],
    ['#dde0cf', '#c6be9a', '#ad8b32', '#937460', '#8c5b7b'],
    ['#181419', '#4a073c', '#9e0b41', '#cc3e18', '#f0971c'],
    ['#029daf', '#e5d599', '#ffc219', '#f07c19', '#e32551'],
    ['#fff5de', '#b8d9c8', '#917081', '#750e49', '#4d002b'],
    ['#4d3b36', '#eb613b', '#f98f6f', '#c1d9cd', '#f7eadc'],
    ['#413040', '#6c6368', '#b9a173', '#eaa353', '#ffefa9'],
    ['#ffcdb8', '#fdeecf', '#c8c696', '#97bea9', '#37260c'],
    ['#213435', '#46685b', '#648a64', '#a6b985', '#e1e3ac'],
    ['#ffffff', '#fffaeb', '#f0f0d8', '#cfcfcf', '#967c52'],
    ['#e8d3a9', '#e39b7d', '#6e6460', '#89b399', '#bcbfa3'],
    ['#ed5672', '#160e32', '#9eae8a', '#cdbb93', '#fbc599'],
    ['#001449', '#012677', '#005bc5', '#00b4fc', '#17f9ff'],
    ['#4dab8c', '#542638', '#8f244d', '#c9306b', '#e86f9e'],
    ['#67be9b', '#95d0b8', '#fcfcd7', '#f1db42', '#f04158'],
    ['#2b1719', '#02483e', '#057c46', '#9bb61b', '#f8be00'],
    ['#ffff00', '#ccd91a', '#99b333', '#668c4d', '#336666'],
    ['#130912', '#3e1c33', '#602749', '#b14623', '#f6921d'],
    ['#e7eed0', '#cad1c3', '#948e99', '#51425f', '#2e1437'],
    ['#e25858', '#e9d6af', '#ffffdd', '#c0efd2', '#384252'],
    ['#e6a06f', '#9e9c71', '#5e8271', '#33454e', '#242739'],
    ['#faf6d0', '#c7d8ab', '#909a92', '#744f78', '#30091e'],
    ['#acdeb2', '#e1eab5', '#edad9e', '#fe4b74', '#390d2d'],
    ['#42282c', '#6ca19e', '#84abaa', '#ded1b6', '#6d997a'],
    ['#9f0a28', '#d55c2b', '#f6e7d3', '#89a46f', '#55203c'],
    ['#418e8e', '#5a4e3c', '#c4d428', '#d8e472', '#e9ebbf'],
    ['#1693a5', '#45b5c4', '#7ececa', '#a0ded6', '#c7ede8'],
    ['#fdffd9', '#73185e', '#36bba6', '#0c0d02', '#8b911a'],
    ['#a69a90', '#4a403d', '#fff1c1', '#facf7d', '#ea804c'],
    ['#f7f3d5', '#ffdabf', '#fa9b9b', '#e88087', '#635063'],
    ['#8a8780', '#e6e5c4', '#d6d1af', '#e47267', '#d7d8c5'],
    ['#a7cd2c', '#bada5f', '#cee891', '#e1f5c4', '#50c8c6'],
    ['#b2cba3', '#e0df9f', '#e7a83e', '#9a736e', '#ea525f'],
    ['#aadead', '#bbdead', '#ccdead', '#dddead', '#eedead'],
    ['#fc580c', '#fc6b0a', '#f8872e', '#ffa927', '#fdca49'],
    ['#fa2e59', '#ff703f', '#f7bc05', '#ecf6bb', '#76bcad'],
    ['#785d56', '#be4c54', '#c6b299', '#e6d5c1', '#fff4e3'],
    ['#f0371a', '#000000', '#f7e6a6', '#3e6b48', '#b5b479'],
    ['#cc2649', '#992c4b', '#66324c', '#33384e', '#003e4f'],
    ['#ffabab', '#ffdaab', '#ddffab', '#abe4ff', '#d9abff'],
    ['#f1e8b4', '#b2bb91', '#d7bf5e', '#d16344', '#83555e'],
    ['#42393b', '#75c9a3', '#bac99a', '#ffc897', '#f7efa2'],
    ['#a7321c', '#ffdc68', '#cc982a', '#928941', '#352504'],
    ['#e0dc8b', '#f6aa3d', '#ed4c57', '#574435', '#6cc4b9'],
    ['#000000', '#001f36', '#1c5560', '#79ae92', '#fbffcd'],
    ['#f6c7b7', '#f7a398', '#fa7f77', '#b42529', '#000000'],
    ['#c9d1d3', '#f7f7f7', '#9dd3df', '#3b3737', '#991818'],
    ['#afc7b9', '#ffe1c9', '#fac7b4', '#fca89d', '#998b82'],
    ['#fbfee5', '#c91842', '#98173d', '#25232d', '#a8e7ca'],
    ['#f3e6bc', '#f1c972', '#f5886b', '#72ae95', '#5a3226'],
    ['#fa8cb1', '#fdc5c9', '#fffee1', '#cfb699', '#9e6d4e'],
    ['#674f23', '#e48b69', '#e1b365', '#e5db84', '#ffeeac'],
    ['#dbd9b7', '#c1c9c8', '#a5b5ab', '#949a8e', '#615566'],
    ['#f2cc67', '#f38264', '#f40034', '#5f051f', '#75baa8'],
    ['#d9d4a8', '#d15c57', '#cc3747', '#5c374b', '#4a5f67'],
    ['#84c1b1', '#ad849a', '#d64783', '#fd135a', '#40202a'],
    ['#71dbd2', '#eeffdb', '#ade4b5', '#d0eaa3', '#fff18c'],
    ['#b88000', '#d56f00', '#f15500', '#ff2654', '#ff0c71'],
    ['#020304', '#541f14', '#938172', '#cc9e61', '#626266'],
    ['#f4f4f4', '#9ba657', '#f0e5c9', '#a68c69', '#594433'],
    ['#244242', '#51bd9c', '#a3e3b1', '#ffe8b3', '#ff2121'],
    ['#1f0310', '#442433', '#a3d95b', '#aae3ab', '#f6f0bc'],
    ['#00ccbe', '#09a6a3', '#9dbfaf', '#edebc9', '#fcf9d8'],
    ['#4eb3de', '#8de0a6', '#fcf09f', '#f27c7c', '#de528c'],
    ['#ff0092', '#ffca1b', '#b6ff00', '#228dff', '#ba01ff'],
    ['#ffc870', '#f7f7c6', '#c8e3c5', '#9cad9a', '#755858'],
    ['#4c3d31', '#f18273', '#f2bd76', '#f4f5de', '#c4ceb0'],
    ['#84bfc3', '#fff5d6', '#ffb870', '#d96153', '#000511'],
    ['#fffdc0', '#b9d7a1', '#fead26', '#ca221f', '#590f0c'],
    ['#241811', '#d4a979', '#e3c88f', '#c2c995', '#a8bd95'],
    ['#2197a3', '#f71e6c', '#f07868', '#ebb970', '#e7d3b0'],
    ['#b2b39f', '#c8c9b5', '#dedfc5', '#f5f7bd', '#3d423c'],
    ['#b31237', '#f03813', '#ff8826', '#ffb914', '#2c9fa3'],
    ['#15212a', '#99c9bd', '#d7b89c', '#feab8d', '#f4c9a3'],
    ['#002c2b', '#ff3d00', '#ffbc11', '#0a837f', '#076461'],
    ['#f88f89', '#eec276', '#fbf6d0', '#79c3aa', '#1f0e1a'],
    ['#bf2a23', '#a6ad3c', '#f0ce4e', '#cf872e', '#8a211d'],
    ['#e2df9a', '#ebe54d', '#757449', '#4b490b', '#ff0051'],
    ['#001848', '#301860', '#483078', '#604878', '#906090'],
    ['#85a29e', '#ffebbf', '#f0d442', '#f59330', '#b22148'],
    ['#79a687', '#718063', '#67594d', '#4f2b38', '#1d1016'],
    ['#fe6c2b', '#d43b2d', '#9f102c', '#340016', '#020001'],
    ['#e6e1cd', '#c6d8c0', '#d6b3b1', '#f97992', '#231b42'],
    ['#69d0b3', '#9bdab3', '#b4dfb3', '#cde4b3', '#d9cf85'],
    ['#75372d', '#928854', '#96a782', '#d4ce9e', '#d8523d'],
    ['#651366', '#a71a5b', '#e7204e', '#f76e2a', '#f0c505'],
    ['#ffffff', '#a1c1be', '#59554e', '#f3f4e5', '#e2e3d9'],
    ['#332c26', '#db1414', '#e8591c', '#7fb8b0', '#c5e65c'],
    ['#2f2bad', '#ad2bad', '#e42692', '#f71568', '#f7db15'],
    ['#8e407a', '#fe6962', '#f9ba84', '#eee097', '#ffffe5'],
    ['#45aab8', '#e1d772', '#faf4b1', '#394240', '#f06b50'],
    ['#ccded2', '#fffbd4', '#f5ddbb', '#e3b8b2', '#a18093'],
    ['#d1b68d', '#87555c', '#492d49', '#51445f', '#5a5c75'],
    ['#539fa2', '#72b1a4', '#abccb1', '#c4dbb4', '#d4e2b6'],
    ['#80d3bb', '#bafdc2', '#e5f3ba', '#5c493d', '#3a352f'],
    ['#a8bcbd', '#fcdcb3', '#f88d87', '#d65981', '#823772'],
    ['#ffe4aa', '#fca699', '#e2869b', '#c9729f', '#583b7e'],
    ['#b5f4bc', '#fff19e', '#ffdc8a', '#ffba6b', '#ff6543'],
    ['#ff4746', '#e8da5e', '#92b55f', '#487d76', '#4b4452'],
    ['#002e34', '#004443', '#00755c', '#00c16c', '#90ff17'],
    ['#101942', '#80043a', '#f60c49', '#f09580', '#fdf2b4'],
    ['#0fc3e8', '#0194be', '#e2d397', '#f07e13', '#481800'],
    ['#c9b849', '#c96823', '#be3100', '#6f0b00', '#241714'],
    ['#9e1e4c', '#ff1168', '#25020f', '#8f8f8f', '#ececec'],
    ['#272d4d', '#b83564', '#ff6a5a', '#ffb350', '#83b8aa'],
    ['#c4ddd6', '#d4ddd6', '#e4ddd6', '#e4e3cd', '#ececdd'],
    ['#4d4a4b', '#f60069', '#ff41a1', '#ff90ab', '#ffccd1'],
    ['#1f0a1d', '#334f53', '#45936c', '#9acc77', '#e5ead4'],
    ['#899aa1', '#bda2a2', '#fbbe9a', '#fad889', '#faf5c8'],
    ['#4b538b', '#15191d', '#f7a21b', '#e45635', '#d60257'],
    ['#706767', '#e87474', '#e6a37a', '#d9c777', '#c0dbab'],
    ['#000000', '#ff8830', '#d1b8a0', '#aeced2', '#cbdcdf'],
    ['#db5643', '#1c0f0e', '#70aa87', '#9fb38f', '#c5bd99'],
    ['#36173d', '#ff4845', '#ff745f', '#ffc55f', '#ffec5e'],
    ['#000706', '#00272d', '#134647', '#0c7e7e', '#bfac8b'],
    ['#170132', '#361542', '#573e54', '#85ae72', '#bce1ab'],
    ['#aab69b', '#9e906e', '#9684a3', '#8870ff', '#000000'],
    ['#d8d8d8', '#e2d9d8', '#ecdad8', '#f5dbd8', '#ffdcd8'],
    ['#c8d197', '#d89845', '#c54b2c', '#473430', '#11baac'],
    ['#f8f8ec', '#aedd2b', '#066699', '#0a5483', '#02416d'],
    ['#d7e8d5', '#e6f0af', '#e8ed76', '#ffcd57', '#4a3a47'],
    ['#f1ecdf', '#d4c9ad', '#c7ba99', '#000000', '#f58723'],
    ['#e9dfcc', '#f3a36b', '#cd5b51', '#554865', '#352630'],
    ['#dacdbd', '#f2b8a0', '#ef97a3', '#df5c7e', '#d4486f'],
    ['#565175', '#538a95', '#67b79e', '#ffb727', '#e4491c'],
    ['#260729', '#2a2344', '#495168', '#ccbd9e', '#d8ccb2'],
    ['#aef055', '#e0ffc3', '#25e4bc', '#3f8978', '#514442'],
    ['#444444', '#fcf7d1', '#a9a17a', '#b52c00', '#8c0005'],
    ['#f7f799', '#e0d124', '#f0823f', '#bd374c', '#443a37'],
    ['#288d85', '#b9d9b4', '#d18e8f', '#b05574', '#f0a991'],
    ['#dbda97', '#efae54', '#ef6771', '#4b1d37', '#977e77'],
    ['#002930', '#ffffff', '#f8f0af', '#ac4a00', '#000000'],
    ['#184848', '#006060', '#007878', '#a8c030', '#f0f0d8'],
    ['#b9113f', '#a8636e', '#97b59d', '#cfcca8', '#ffe3b3'],
    ['#c8ce13', '#f8f5c1', '#349e97', '#2c0d1a', '#de1a72'],
    ['#913f33', '#ff705f', '#ffaa67', '#ffdfab', '#9fb9c2'],
    ['#fee9a6', '#fec0ab', '#fa5894', '#660860', '#9380b7'],
    ['#ed7b83', '#ec8a90', '#eba2a4', '#e6d1ca', '#eee9c7'],
    ['#fcfdeb', '#e3cebd', '#c1a2a0', '#725b75', '#322030'],
    ['#e04891', '#e1b7ed', '#f5e1e2', '#d1e389', '#b9de51'],
    ['#d3c8b4', '#d4f1db', '#eecab1', '#fe6c63', '#240910'],
    ['#43777a', '#442432', '#c02948', '#d95b45', '#ecd079'],
    ['#edeccf', '#f1c694', '#dc6378', '#207178', '#101652'],
    ['#95de90', '#cef781', '#f7c081', '#ff7857', '#6b6b6b'],
    ['#edd58f', '#c2bf92', '#66ac92', '#686077', '#641f5e'],
    ['#f4f8e6', '#f2e9e6', '#4a3d3d', '#ff6161', '#d8dec3'],
    ['#f9ebf2', '#f3e2e8', '#fcd7da', '#f58f9a', '#3c363b'],
    ['#736558', '#fd65a0', '#fef5c6', '#aaf2e4', '#31d5de'],
    ['#f9f6ec', '#88a1a8', '#502940', '#790614', '#0d0c0c'],
    ['#affbff', '#d2fdfe', '#fefac2', '#febf97', '#fe6960'],
    ['#ffffff', '#a1ac88', '#757575', '#464d70', '#000000'],
    ['#f2502c', '#cad17a', '#fcf59b', '#91c494', '#c42311'],
    ['#2e1e45', '#612a52', '#ba3259', '#ff695c', '#ccbca1'],
    ['#910142', '#6c043c', '#210123', '#fef7d5', '#0ec0c1'],
    ['#204b5e', '#426b65', '#baab6a', '#fbea80', '#fdfac7'],
    ['#8dc9b5', '#f6f4c2', '#ffc391', '#ff695c', '#8c315d'],
    ['#e3ba6a', '#bfa374', '#6d756a', '#4d686f', '#364461'],
    ['#fffab3', '#a2e5d2', '#63b397', '#9dab34', '#2c2321'],
    ['#f7f1e1', '#ffdbd7', '#ffb2c1', '#ce7095', '#855e6e'],
    ['#f7dece', '#eed7c5', '#ccccbb', '#9ec4bb', '#2d2e2c'],
    ['#4180ab', '#ffffff', '#8ab3cf', '#bdd1de', '#e4ebf0'],
    ['#43204a', '#7f1e47', '#422343', '#c22047', '#ea284b'],
    ['#686466', '#839cb5', '#96d7eb', '#b1e1e9', '#f2e4f9'],
    ['#ff275e', '#e6bc56', '#7f440a', '#6a9277', '#f8d9bd'],
    ['#50232e', '#f77c3e', '#faba66', '#fce185', '#a2cca5'],
    ['#b2d9f7', '#487aa1', '#3d3c3b', '#7c8071', '#dde3ca'],
    ['#9c8680', '#eb5e7f', '#f98f6f', '#dbbf6b', '#c8eb6a'],
    ['#482c21', '#a73e2b', '#d07e0e', '#e9deb0', '#2f615e'],
    ['#e4e6c3', '#88baa3', '#ba1e4a', '#63203d', '#361f2d'],
    ['#f7f6e4', '#e2d5c1', '#5f3711', '#f6f6e2', '#d4c098'],
    ['#ffab03', '#fc7f03', '#fc3903', '#d1024e', '#a6026c'],
    ['#c72546', '#66424c', '#768a4f', '#b3c262', '#d5ca98'],
    ['#c3dfd7', '#c8dfd2', '#cddfcd', '#d2dfc8', '#d7dfc3'],
    ['#0db2ac', '#f5dd7e', '#fc8d4d', '#fc694d', '#faba32'],
    ['#e8de92', '#810e0b', '#febea3', '#fce5b1', '#f6f5da'],
    ['#63594d', '#b18272', '#c2b291', '#d6e4c3', '#eae3d1'],
    ['#dae2cb', '#96c3a6', '#6cb6a5', '#221d34', '#90425c'],
    ['#917f6e', '#efbc98', '#efd2be', '#efe1d1', '#d9ddcd'],
    ['#3f324d', '#93c2b1', '#ffeacc', '#ff995e', '#de1d6a'],
    ['#f3d915', '#e9e4bb', '#bfd4b7', '#a89907', '#1a1c27'],
    ['#042608', '#2a5c0b', '#808f12', '#faedd9', '#ea2a15'],
    ['#dadad8', '#fe6196', '#ff2c69', '#1ea49d', '#cbe65b'],
    ['#454545', '#743455', '#a22365', '#d11174', '#ff0084'],
    ['#8c0e48', '#80ab99', '#e8dbad', '#b39e58', '#99822d'],
    ['#796c86', '#74aa9b', '#91c68d', '#ece488', '#f6f5cd'],
    ['#678d6c', '#fc7d23', '#fa3c08', '#bd0a41', '#772a53'],
    ['#dbf73b', '#c0cc39', '#eb0258', '#a6033f', '#2b2628'],
    ['#ffc2ce', '#80b3ff', '#fd6e8a', '#a2122f', '#693726'],
    ['#ab505e', '#d9a071', '#cfc88f', '#a5b090', '#607873'],
    ['#f9d423', '#ede574', '#e1f5c4', '#add6bc', '#79b7b4'],
    ['#172c3c', '#274862', '#995052', '#d96831', '#e6b33d'],
    ['#f8f69f', '#bab986', '#7c7b6c', '#3e3e53', '#000039'],
    ['#f1ebeb', '#eee8e8', '#cacaca', '#24c0eb', '#5cceee'],
    ['#e6e8e3', '#d7dacf', '#bec3bc', '#8f9a9c', '#65727a'],
    ['#fffbf0', '#968f4b', '#7a6248', '#ab9597', '#030506'],
    ['#efac41', '#de8531', '#b32900', '#6c1305', '#330a04'],
    ['#72bca5', '#f4ddb4', '#f1ae2b', '#bc0b27', '#4a2512'],
    ['#ebf2f2', '#d0f2e7', '#bcebdf', '#ade0db', '#d9dbdb'],
    ['#f4e196', '#a6bf91', '#5f9982', '#78576b', '#400428'],
    ['#615050', '#776a6a', '#ad9a6f', '#f5f1e8', '#fcfcfc'],
    ['#b9340b', '#cea45c', '#c5be8b', '#498379', '#3f261c'],
    ['#ddcaa2', '#aebea3', '#b97479', '#d83957', '#4e5c69'],
    ['#141827', '#62455b', '#736681', '#c1d9d0', '#fffae3'],
    ['#2f3559', '#9a5071', '#e394a7', '#f1bbbb', '#e6d8cb'],
    ['#b877a8', '#b8008a', '#ff3366', '#ffcc33', '#ccff33'],
    ['#171133', '#581e44', '#c5485a', '#d4be99', '#e0ffcc'],
    ['#ff0f35', '#f86254', '#fea189', '#f3d5a5', '#bab997'],
    ['#cfb698', '#ff5d57', '#dd0b64', '#6f0550', '#401c2a'],
    ['#d1dbc8', '#b8c2a0', '#c97c7a', '#da3754', '#1f1106'],
    ['#2b9eb3', '#85cc9c', '#bcd9a0', '#edf79e', '#fafad7'],
    ['#f26b7a', '#f0f2dc', '#d9eb52', '#8ac7de', '#87796f'],
    ['#bdbf90', '#35352b', '#e7e9c4', '#ec6c2b', '#feae4b'],
    ['#eeccbb', '#f1731f', '#e03e36', '#bd0d59', '#730662'],
    ['#ebe5b2', '#f6f3c2', '#f7c69f', '#f89b7e', '#b5a28b'],
    ['#20130a', '#142026', '#123142', '#3b657a', '#e9f0c9'],
    ['#9d9f89', '#84af97', '#8bc59b', '#b2de93', '#ccee8d'],
    ['#ff9934', '#ffc018', '#f8fef4', '#cde54e', '#b3c631'],
    ['#bda0a2', '#ffe6db', '#d1eaee', '#cbc8b5', '#efb0a9'],
    ['#31827c', '#95c68f', '#f7e9aa', '#fc8a80', '#fd4e6d'],
    ['#4d433d', '#525c5a', '#56877d', '#8ccc81', '#bade57'],
    ['#6a3d5a', '#66666e', '#6d8d76', '#b0c65a', '#ebf74f'],
    ['#353437', '#53576b', '#7a7b7c', '#a39b7e', '#e2c99f'],
    ['#ff9966', '#d99973', '#b39980', '#8c998c', '#669999'],
    ['#d1dab9', '#92bea5', '#6f646c', '#671045', '#31233e'],
    ['#839074', '#939e78', '#a8a878', '#061013', '#cdcd76'],
    ['#52423c', '#ad5c70', '#d3ad98', '#edd4be', '#b9c3c4'],
    ['#ffcfad', '#ffe4b8', '#e6d1b1', '#b8aa95', '#5e5a54'],
    ['#eb9d8d', '#93865a', '#a8bb9a', '#c5cba6', '#efd8a9'],
    ['#a8c078', '#a89048', '#a84818', '#61290e', '#330c0c'],
    ['#27081d', '#47232c', '#66997b', '#a4ca8b', '#d2e7aa'],
    ['#ffe7bf', '#ffc978', '#c9c987', '#d1a664', '#c27b57'],
    ['#000000', '#ed0b65', '#b2a700', '#fcae11', '#770493'],
    ['#031c30', '#5a3546', '#b5485f', '#fc6747', '#fa8d3b'],
    ['#a22c27', '#4f2621', '#9f8241', '#ebd592', '#929867'],
    ['#8fc9b9', '#d8d9c0', '#d18e8f', '#ab5c72', '#91334f'],
    ['#302727', '#ba2d2d', '#f2511b', '#f2861b', '#c7c730'],
    ['#f9ded3', '#fdd1b6', '#fab4b6', '#c7b6be', '#89abb4'],
    ['#7375a5', '#21a3a3', '#13c8b5', '#6cf3d5', '#2b364a'],
    ['#820081', '#fe59c2', '#fe40b9', '#fe1cac', '#390039'],
    ['#262525', '#525252', '#e6ddbc', '#822626', '#690202'],
    ['#f3214e', '#cf023b', '#000000', '#f4a854', '#fff8bc'],
    ['#482344', '#2b5166', '#429867', '#fab243', '#e02130'],
    ['#a9b79e', '#e8ddbd', '#dba887', '#c25848', '#9d1d36'],
    ['#6e9167', '#ffdd8c', '#ff8030', '#cc4e00', '#700808'],
    ['#ff3366', '#e64066', '#cc4d66', '#b35966', '#996666'],
    ['#331436', '#7a1745', '#cb4f57', '#eb9961', '#fcf4b6'],
    ['#ec4b59', '#9a2848', '#130716', '#fc8c77', '#f8dfbd'],
    ['#1f0b0c', '#e7fccf', '#d6c396', '#b3544f', '#300511'],
    ['#f3dcb2', '#facb97', '#f59982', '#ed616f', '#f2116c'],
    ['#f7ead9', '#e1d2a9', '#88b499', '#619885', '#67594e'],
    ['#adeada', '#bdeadb', '#cdeadc', '#ddeadd', '#edeade'],
    ['#666666', '#abdb25', '#999999', '#ffffff', '#cccccc'],
    ['#210518', '#3d1c33', '#5e4b55', '#7c917f', '#93bd9a'],
    ['#fdbf5c', '#f69a0b', '#d43a00', '#9b0800', '#1d2440'],
    ['#fdf4b0', '#a4dcb9', '#5bcebf', '#32b9be', '#2e97b7'],
    ['#8ba6ac', '#d7d7b8', '#e5e6c9', '#f8f8ec', '#bdcdd0'],
    ['#295264', '#fad9a6', '#bd2f28', '#89373d', '#142433'],
    ['#ecf8d4', '#e0deab', '#cb8e5f', '#85685a', '#0d0502'],
    ['#a2c7bb', '#dde29f', '#ac8d49', '#ac0d0d', '#320606'],
    ['#ff667c', '#fbbaa4', '#f9e5c0', '#2c171c', '#b6d0a0'],
    ['#4b4b55', '#f4324a', '#ff516c', '#fb9c5a', '#fcc755'],
    ['#ffad08', '#edd75a', '#73b06f', '#0c8f8f', '#405059'],
    ['#a8ab84', '#000000', '#c6c99d', '#0c0d05', '#e7ebb0'],
    ['#332e1d', '#5ac7aa', '#9adcb9', '#fafcd3', '#efeba9']
];

class FractalTreeNode {
    constructor(value, parentNode = null, generateChildren, depth) {
        this.value = value;
        this.parentNode = parentNode;
        this.children = [];
        this.depth = depth;

        if (depth) generateChildren(value).forEach(child => this.addChild(child, generateChildren, depth));
    }

    addChild(value, generateChildren, depth) {
        this.children.push(new FractalTreeNode(value, this, generateChildren, depth - 1));
    }

    hasChildren() {
        return Boolean(this.children.length);
    }

    getFirstChild() {
        return this.children[0];
    }

    hasNextSibling() {
        return this.parentNode !== null && (this.parentNode.children.indexOf(this) + 1 < this.parentNode.children.length);
    }

    getNextSibling() {
        return this.parentNode.children[this.parentNode.children.indexOf(this) + 1];
    }
}

class FractalTree {
    constructor(start, generateChildren, depth) {
        this.depth = depth;
        try {
            this.root = new FractalTreeNode(start, null, generateChildren, depth);
        } catch (e) {
            console.error('Try reducing the depth');
        }
    }

    getValuesAtDepth(depth) {
        return this.getNodesAtDepth(depth).map(node => node.value);
    }

    getNodesAtDepth(depth) {
        if (depth > this.depth) throw new Error("Depth cannot exceed tree depth");

        const nodes = [];
        let currentNode = this.root, currentDepth = 1;
        const stack = [], completed = [];

        do {
            if (currentNode.hasChildren() && currentDepth < depth && !completed.includes(currentNode)) {
                stack.push(currentNode);
                currentNode = currentNode.getFirstChild();
                currentDepth++;
            } else {
                if (currentDepth === depth && !completed.includes(currentNode)) nodes.push(currentNode);

                if (currentNode.hasNextSibling()) currentNode = currentNode.getNextSibling();
                else {
                    completed.push(currentNode.parentNode);
                    currentNode = stack.pop();
                    currentDepth--;
                }
            }
        } while (stack.length);

        return nodes;
    }
}
class MMKochCode extends HTMLElement {
    constructor() {
        super();
        // Attach a shadow DOM
        const shadow = this.attachShadow({ mode: 'open' });
        // Create a canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('l__canvas');
        this.paintColor = { rgba: { r: 0, g: 0, b: 0, a: 1 } };
        this.backgroundColor = { rgba: { r: 1, g: 1, b: 1, a: 1 } };
        shadow.innerHTML = `<style>
        :host {
          display: grid;
        }
        canvas {
          width: 100%;
          min-height: 100%;
        }
        </style>`; // Clear previous canvas
        shadow.appendChild(this.canvas);

        this.RGBAPalette = paletteHex.map(palette => {
            return palette.map(hex => getColorRBGA(hexToRgbA(hex)))
        })

        this.showGrowth = this.hasAttribute('showgrowth') ? this.getAttribute('showgrowth') === 'true' : true;
        this.levels = this.hasAttribute('levels') ? parseInt(this.getAttribute('levels')) : 5;

    }
    connectedCallback() {
        this.initialize(this.canvas);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'showgrowth') {
            this.showGrowth = newValue === 'true';
        } else if (name === 'levels') {
            this.levels = parseInt(newValue) || 5;
        }
        this.paint(this.gl, this.simpleShader);
    }
    initialize(canvas) {
        const { gl, simpleShader } = this.initializeWebGL(canvas)
        this.gl = gl
        this.simpleShader = simpleShader
        this.paint(gl, simpleShader)
    }

    setupShader(gl) {
        // Shader creation and setup logic can go here...
        return simpleShader;
    }
    getWebGLContext(canvas) {
        const gl = canvas.getContext('webgl', {
            antialias: true
        })
        if (!gl) {
            console.error('WEBGL not available')
        }
        return gl
    }
    resize(gl) {
        var realToCSSPixels = window.devicePixelRatio

        // Lookup the size the browser is displaying the canvas in CSS pixels
        // and compute a size needed to make our drawingbuffer match it in
        // device pixels.
        var displayWidth = Math.floor(gl.canvas.clientWidth * realToCSSPixels)
        var displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels)

        // Check if the canvas is not the same size.
        if (
            gl.canvas.width !== displayWidth ||
            gl.canvas.height !== displayHeight
        ) {
            // Make the canvas the same size
            gl.canvas.width = displayWidth
            gl.canvas.height = displayHeight
        }
    }
    clearCanvas(gl, color = [0, 0, 0, 0]) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
        // Clear the canvas
        gl.clearColor(...color)
        gl.clear(gl.COLOR_BUFFER_BIT)
    }
    createProgram(gl, vertexShader, fragmentShader) {
        var program = gl.createProgram()
        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)
        var success = gl.getProgramParameter(program, gl.LINK_STATUS)
        if (success) {
            return program
        }
        console.error(gl.getProgramInfoLog(program))
        gl.deleteProgram(program)
    }
    createShader(gl, type, source) {
        var shader = gl.createShader(type)
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
        if (success) {
            return shader
        }
        console.log('Create Shader ERROR: ', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
    }
    getSimpleVertexShader(gl) {
        return this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    }
    getSimpleFragmentShader(gl) {
        return this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    }
    initSimpleProgram(
        gl,
        program,
        resolutionUniformLocation,
        colorUniformLocation,
        positionAttributeLocation,
        positionBuffer
    ) {
        gl.useProgram(program)
        // set the resolution
        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height)
        // Set a random color.
        gl.uniform4f(colorUniformLocation, 0, 0, 0, 1)
        gl.enableVertexAttribArray(positionAttributeLocation)
        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    }
    changeColor(r = 0, g = 0, b = 0, a = 1) {
        this.gl.uniform4f(
            this.simpleShader.colorUniformLocation,
            r,
            b,
            g,
            a
        )
    }
    initializeWebGL(canvas, color = [0, 0, 0, 0]) {
        const gl = this.getWebGLContext(canvas)
        this.resize(gl)
        this.clearCanvas(gl, color)
        const program = this.createProgram(
            gl,
            this.getSimpleVertexShader(gl),
            this.getSimpleFragmentShader(gl)
        )
        const positionAttributeLocation = gl.getAttribLocation(
            program,
            'a_position'
        )
        const resolutionUniformLocation = gl.getUniformLocation(
            program,
            'u_resolution'
        )
        const colorUniformLocation = gl.getUniformLocation(program, 'u_color')
        const positionBuffer = gl.createBuffer()
        const simpleShader = {
            program: program,
            positionAttributeLocation: positionAttributeLocation,
            resolutionUniformLocation: resolutionUniformLocation,
            colorUniformLocation: colorUniformLocation,
            positionBuffer: positionBuffer
        }
        this.initSimpleProgram(
            gl,
            program,
            resolutionUniformLocation,
            colorUniformLocation,
            positionAttributeLocation,
            positionBuffer
        )

        return { gl: gl, simpleShader: simpleShader }
    }
    paint(gl, simpleShader) {
        const levels = 5; // or fetch dynamically
        this.changeColor(gl, ...this.getPaintColorRBGA());
        this.clearCanvas(gl, this.getBackgroundColorRBGA());

        const width = gl.canvas.width;
        const marginX = 0;
        const marginY = gl.canvas.height / 2;
        const points = [0 + marginX, 0 + marginY, width - marginX, 0 + marginY];

        const fractalTree = new FractalTree(points, generateChildren, levels);

        const rangeArray = this.getRangeArray(levels).reverse();
        const palette = this.RGBAPalette[34]; //this.getRandomItem(this.RGBAPalette);

        console.log(fractalTree, rangeArray, palette);
        console.log(...palette[5 % palette.length]);

        if (this.showGrowth) {
            rangeArray.forEach(level => {
                fractalTree.getValuesAtDepth(level).forEach((points, index) => {
                    this.changeColor(gl, ...palette[level % palette.length]);
                    this.drawLine(gl, simpleShader, ...points);
                });
            });
        } else {
            this.changeColor(gl, ...palette[levels % palette.length]);
            fractalTree.getValuesAtDepth(levels).forEach(points => this.drawLine(gl, simpleShader, ...points));
        }
    }
    getPaintColorRBGA() {
        return [
            this.paintColor.rgba.r / 255,
            this.paintColor.rgba.b / 255,
            this.paintColor.rgba.g / 255,
            this.paintColor.rgba.a
        ]
    }
    getBackgroundColorRBGA() {
        return [
            this.backgroundColor.rgba.r / 255,
            this.backgroundColor.rgba.b / 255,
            this.backgroundColor.rgba.g / 255,
            0.0
        ]
    }
    getRangeArray(length) {
        return [...Array(length).keys()].map(x => x + 1)
    }
    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)]
    }
    drawLine(gl, shader, x1, y1, x2, y2) {
        // setRectangle(gl,600,600,100,100);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([x1, y1, x2, y2]),
            gl.STATIC_DRAW
        )
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        const size = 2 // 2 components per iteration
        const type = gl.FLOAT // the data is 32bit floats
        const normalize = false // don't normalize the data
        const stride = 0 // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0 // start at the beginning of the buffer
        gl.vertexAttribPointer(
            shader.positionAttributeLocation,
            size,
            type,
            normalize,
            stride,
            offset
        )
        this.renderLine(gl)
    }
    renderLine(gl) {
        var primitiveType = gl.LINES
        var offset = 0
        var count = 2
        gl.drawArrays(primitiveType, offset, count)
    }
    getChildLinePointsForLevelsArray(points, levelsArray = []) {
        return levelsArray.reduce(
            (a, i) => [...a, ...this.getChildLinePoints(points, i)],
            []
        )
    }
    getChildLinePoints(points, depth = 0) {
        if (depth === 0) {
            const Ax = points[0]
            const Ay = points[1]
            const Bx = points[2]
            const By = points[3]
            const Ux = Bx - Ax
            const Uy = By - Ay
            const Vx = Ay - By
            const Vy = Bx - Ax
            const Px = Ax + (1 / 3) * Ux
            const Py = Ay + (1 / 3) * Uy
            const Qx = Ax + (1 / 2) * Ux + (Math.sqrt(3) / 6) * Vx
            const Qy = Ay + (1 / 2) * Uy + (Math.sqrt(3) / 6) * Vy
            const Rx = Ax + (2 / 3) * Ux
            const Ry = Ay + (2 / 3) * Uy
            return [
                [Ax, Ay, Px, Py],
                [Px, Py, Qx, Qy],
                [Qx, Qy, Rx, Ry],
                [Rx, Ry, Bx, By]
            ]
        } else {
            const xpoints = [...this.getChildLinePoints(points, depth - 1)]
            return xpoints.reduce(
                (acc, point) => [...acc, ...this.getChildLinePoints(point)],
                []
            )
        }
    }

    // Other methods as needed, such as getRandomPalette, drawLine, etc.
}

customElements.define('mm-kochcode', MMKochCode);

// Helper classes and functions for FractalTree, FractalTreeNode, generateChildren, etc.



function generateChildren(points) {
    const [Ax, Ay, Bx, By] = points;
    const [Ux, Uy] = [Bx - Ax, By - Ay];
    const [Vx, Vy] = [Ay - By, Bx - Ax];

    const Px = Ax + (1 / 3) * Ux, Py = Ay + (1 / 3) * Uy;
    const [Qx, Qy] = [Ax + (1 / 2) * Ux + (Math.sqrt(3) / 6) * Vx, Ay + (1 / 2) * Uy + (Math.sqrt(3) / 6) * Vy];
    const [Rx, Ry] = [Ax + (2 / 3) * Ux, Ay + (2 / 3) * Uy];

    return [
        [Ax, Ay, Px, Py],
        [Px, Py, Qx, Qy],
        [Qx, Qy, Rx, Ry],
        [Rx, Ry, Bx, By]
    ];
}

function hexToRgbA(hex) {
    var c
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('')
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]]
        }
        c = '0x' + c.join('')
        return { r: (c >> 16) & 255, g: (c >> 8) & 255, b: c & 255, a: 1 }
    }
    throw new Error('Bad Hex')
}
function getColorRBGA(rgba) {
    return [rgba.r / 255, rgba.b / 255, rgba.g / 255, rgba.a]
}


