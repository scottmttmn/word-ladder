import type { MoveType, Puzzle } from './types'
import type { WordGraph } from './graph'
import { getNeighbors } from './graph'

export interface GeneratorOptions {
  targetPathLength: number
  activeMoveTypes: MoveType[]
  prng?: () => number
}

// Common, recognizable words that make good puzzle start/end words.
// These are short, everyday words most English speakers would know.
const GOOD_PUZZLE_WORDS = new Set([
  // 3-letter
  'act', 'add', 'age', 'ago', 'aid', 'aim', 'air', 'all', 'and', 'ant', 'any', 'ape', 'arc', 'are', 'ark', 'arm', 'art', 'ash', 'ask', 'ate',
  'bad', 'bag', 'ban', 'bar', 'bat', 'bay', 'bed', 'bee', 'bet', 'big', 'bin', 'bit', 'bog', 'bow', 'box', 'boy', 'bud', 'bug', 'bun', 'bus', 'but', 'buy',
  'cab', 'can', 'cap', 'car', 'cat', 'cop', 'cow', 'cry', 'cub', 'cup', 'cur', 'cut',
  'dad', 'dam', 'day', 'den', 'dew', 'did', 'die', 'dig', 'dim', 'dip', 'dog', 'dot', 'dry', 'dub', 'dud', 'due', 'dug', 'dye',
  'ear', 'eat', 'eel', 'egg', 'elm', 'end', 'era', 'eve', 'ewe', 'eye',
  'fan', 'far', 'fat', 'fax', 'fed', 'fee', 'few', 'fig', 'fin', 'fir', 'fit', 'fix', 'fly', 'fog', 'for', 'fox', 'fry', 'fun', 'fur',
  'gag', 'gap', 'gas', 'gel', 'gem', 'get', 'gin', 'god', 'got', 'gum', 'gun', 'gut', 'guy', 'gym',
  'had', 'ham', 'has', 'hat', 'hay', 'hen', 'her', 'hid', 'him', 'hip', 'his', 'hit', 'hog', 'hop', 'hot', 'how', 'hub', 'hue', 'hug', 'hum', 'hut',
  'ice', 'icy', 'ill', 'imp', 'ink', 'inn', 'ion', 'ire', 'irk', 'its', 'ivy',
  'jab', 'jag', 'jam', 'jar', 'jaw', 'jay', 'jet', 'jig', 'job', 'jog', 'joy', 'jug', 'jut',
  'keg', 'ken', 'key', 'kid', 'kin', 'kit',
  'lab', 'lad', 'lag', 'lap', 'law', 'lay', 'led', 'leg', 'let', 'lid', 'lie', 'lip', 'lit', 'log', 'lot', 'low',
  'mad', 'man', 'map', 'mat', 'may', 'men', 'met', 'mid', 'mix', 'mob', 'mom', 'mop', 'mow', 'mud', 'mug', 'mum',
  'nag', 'nap', 'net', 'new', 'nil', 'nip', 'nod', 'nor', 'not', 'now', 'nun', 'nut',
  'oak', 'oar', 'oat', 'odd', 'off', 'oft', 'oil', 'old', 'one', 'opt', 'orb', 'ore', 'our', 'out', 'owe', 'owl', 'own',
  'pad', 'pal', 'pan', 'pat', 'paw', 'pay', 'pea', 'peg', 'pen', 'per', 'pet', 'pie', 'pig', 'pin', 'pit', 'ply', 'pod', 'pop', 'pot', 'pow', 'pry', 'pub', 'pug', 'pun', 'pup', 'put',
  'rag', 'ram', 'ran', 'rap', 'rat', 'raw', 'ray', 'red', 'ref', 'rib', 'rid', 'rig', 'rim', 'rip', 'rob', 'rod', 'rot', 'row', 'rub', 'rug', 'rum', 'run', 'rut',
  'sac', 'sad', 'sag', 'sap', 'sat', 'saw', 'say', 'sea', 'set', 'sew', 'shy', 'sin', 'sip', 'sir', 'sis', 'sit', 'six', 'ski', 'sky', 'sly', 'sob', 'sod', 'son', 'sop', 'sow', 'spy', 'sub', 'sue', 'sum', 'sun',
  'tab', 'tag', 'tan', 'tap', 'tar', 'tax', 'tea', 'ten', 'the', 'tie', 'tin', 'tip', 'toe', 'ton', 'too', 'top', 'tow', 'toy', 'try', 'tub', 'tug', 'two',
  'urn', 'use',
  'van', 'vat', 'vet', 'vie', 'vim', 'vow',
  'wad', 'wag', 'war', 'was', 'wax', 'way', 'web', 'wed', 'wet', 'who', 'why', 'wig', 'win', 'wit', 'woe', 'wok', 'won', 'woo', 'wow',
  'yam', 'yap', 'yaw', 'yes', 'yet', 'yew', 'you',
  'zap', 'zed', 'zen', 'zip', 'zoo',
  // 4-letter
  'able', 'ache', 'acid', 'acre', 'aged', 'aide', 'ally', 'also', 'arch', 'area', 'army', 'aunt', 'auto', 'avid', 'axle',
  'back', 'bake', 'bald', 'ball', 'band', 'bang', 'bank', 'bare', 'bark', 'barn', 'base', 'bath', 'bead', 'beam', 'bean', 'bear', 'beat', 'beef', 'been', 'beer', 'bell', 'belt', 'bend', 'best', 'bike', 'bill', 'bind', 'bird', 'bite', 'blow', 'blue', 'blur', 'boat', 'body', 'bold', 'bolt', 'bomb', 'bond', 'bone', 'book', 'boom', 'boot', 'bore', 'born', 'boss', 'both', 'bowl', 'bulk', 'bull', 'bump', 'burn', 'bury', 'bush', 'busy', 'buzz',
  'cage', 'cake', 'calf', 'call', 'calm', 'came', 'camp', 'cape', 'card', 'care', 'cart', 'case', 'cash', 'cast', 'cave', 'cell', 'chat', 'chef', 'chin', 'chip', 'chop', 'city', 'clad', 'clam', 'clap', 'claw', 'clay', 'clip', 'club', 'clue', 'coal', 'coat', 'code', 'coil', 'coin', 'cold', 'come', 'cook', 'cool', 'cope', 'copy', 'cord', 'core', 'cork', 'corn', 'cost', 'cozy', 'crab', 'crew', 'crop', 'crow', 'cure', 'curl', 'cute',
  'dame', 'damp', 'dare', 'dark', 'dart', 'dash', 'data', 'dawn', 'dead', 'deaf', 'deal', 'dear', 'debt', 'deck', 'deed', 'deem', 'deep', 'deer', 'deny', 'desk', 'dial', 'dice', 'diet', 'dime', 'dine', 'dire', 'dirt', 'dish', 'disk', 'dock', 'does', 'dome', 'done', 'doom', 'door', 'dose', 'dove', 'down', 'drag', 'draw', 'drip', 'drop', 'drum', 'dual', 'duck', 'dude', 'duel', 'duke', 'dull', 'dumb', 'dump', 'dune', 'dusk', 'dust', 'duty',
  'each', 'earn', 'ease', 'east', 'easy', 'edge', 'else', 'emit', 'envy', 'epic', 'even', 'evil', 'exam', 'exit', 'eyed',
  'face', 'fact', 'fade', 'fail', 'fair', 'fake', 'fall', 'fame', 'fang', 'fare', 'farm', 'fast', 'fate', 'fawn', 'fear', 'feat', 'feed', 'feel', 'fell', 'felt', 'fern', 'file', 'fill', 'film', 'find', 'fine', 'fire', 'firm', 'fish', 'fist', 'five', 'flag', 'flap', 'flat', 'flaw', 'flea', 'fled', 'flex', 'flip', 'flit', 'flow', 'foam', 'fold', 'folk', 'fond', 'food', 'fool', 'foot', 'ford', 'fork', 'form', 'fort', 'foul', 'four', 'free', 'frog', 'from', 'fuel', 'full', 'fume', 'fund', 'fuse', 'fury', 'fuss',
  'gain', 'gait', 'gale', 'game', 'gang', 'garb', 'gate', 'gave', 'gaze', 'gear', 'gift', 'gild', 'girl', 'give', 'glad', 'glow', 'glue', 'goal', 'goat', 'goes', 'gold', 'golf', 'gone', 'good', 'grab', 'gram', 'gray', 'grew', 'grid', 'grim', 'grin', 'grip', 'grit', 'grow', 'gulf', 'gust',
  'hack', 'hail', 'hair', 'half', 'hall', 'halt', 'hand', 'hang', 'hard', 'hare', 'harm', 'harp', 'hate', 'haul', 'have', 'haze', 'hazy', 'head', 'heal', 'heap', 'hear', 'heat', 'heed', 'heel', 'held', 'help', 'herb', 'herd', 'here', 'hero', 'hide', 'high', 'hike', 'hill', 'hint', 'hire', 'hold', 'hole', 'holy', 'home', 'hood', 'hook', 'hope', 'horn', 'hose', 'host', 'hour', 'huge', 'hull', 'hung', 'hunt', 'hurl', 'hurt',
  'icon', 'idea', 'idle', 'inch', 'into', 'iron', 'item',
  'jack', 'jade', 'jail', 'jazz', 'jean', 'jerk', 'jest', 'join', 'joke', 'jolt', 'jump', 'june', 'jury', 'just',
  'keen', 'keep', 'kept', 'kick', 'kill', 'kind', 'king', 'kiss', 'kite', 'knee', 'knew', 'knit', 'knob', 'knot', 'know',
  'lace', 'lack', 'laid', 'lake', 'lamb', 'lame', 'lamp', 'land', 'lane', 'lard', 'last', 'late', 'lawn', 'lazy', 'lead', 'leaf', 'leak', 'lean', 'leap', 'left', 'lend', 'less', 'lick', 'life', 'lift', 'like', 'limb', 'lime', 'limp', 'line', 'link', 'lion', 'list', 'live', 'load', 'loaf', 'loan', 'lock', 'loft', 'lone', 'long', 'look', 'loop', 'lord', 'lore', 'lose', 'loss', 'lost', 'loud', 'love', 'luck', 'lump', 'lung', 'lure', 'lurk', 'lush', 'lust',
  'mace', 'made', 'mail', 'main', 'make', 'male', 'mall', 'malt', 'mane', 'many', 'mark', 'mask', 'mass', 'mast', 'mate', 'maze', 'meal', 'mean', 'meat', 'meet', 'melt', 'memo', 'mend', 'menu', 'mere', 'mesh', 'mess', 'mild', 'mile', 'milk', 'mill', 'mind', 'mine', 'mint', 'miss', 'mist', 'moan', 'mock', 'mode', 'mold', 'mole', 'mood', 'moon', 'more', 'moss', 'most', 'moth', 'move', 'much', 'mule', 'muse', 'must', 'mute',
  'nail', 'name', 'navy', 'near', 'neat', 'neck', 'need', 'nest', 'next', 'nice', 'nine', 'node', 'none', 'noon', 'norm', 'nose', 'note', 'noun',
  'obey', 'odds', 'odor', 'omen', 'once', 'only', 'onto', 'ooze', 'open', 'oral', 'oval', 'oven', 'over', 'owed',
  'pace', 'pack', 'page', 'paid', 'pail', 'pain', 'pair', 'pale', 'palm', 'pane', 'park', 'part', 'pass', 'past', 'path', 'pave', 'peak', 'peal', 'pear', 'peel', 'peer', 'pick', 'pile', 'pine', 'pink', 'pipe', 'plan', 'play', 'plea', 'plot', 'plow', 'ploy', 'plug', 'plum', 'plus', 'poem', 'poet', 'poke', 'pole', 'poll', 'pond', 'pool', 'poor', 'pope', 'pork', 'port', 'pose', 'post', 'pour', 'pray', 'prey', 'prop', 'pros', 'pull', 'pulp', 'pump', 'pure', 'push',
  'quit', 'quiz',
  'race', 'rack', 'raft', 'rage', 'raid', 'rail', 'rain', 'rake', 'ramp', 'rang', 'rank', 'rare', 'rash', 'rate', 'rave', 'read', 'real', 'reap', 'rear', 'reed', 'reef', 'reel', 'rely', 'rent', 'rest', 'rice', 'rich', 'ride', 'rift', 'ring', 'ripe', 'rise', 'risk', 'road', 'roam', 'roar', 'robe', 'rock', 'rode', 'role', 'roll', 'roof', 'room', 'root', 'rope', 'rose', 'ruin', 'rule', 'rush', 'rust',
  'sack', 'safe', 'sage', 'said', 'sail', 'sake', 'sale', 'salt', 'same', 'sand', 'sane', 'sang', 'save', 'seal', 'seam', 'seat', 'seed', 'seek', 'seem', 'seen', 'self', 'sell', 'send', 'sent', 'shed', 'shin', 'ship', 'shop', 'shot', 'show', 'shut', 'sick', 'side', 'sift', 'sigh', 'sign', 'silk', 'sing', 'sink', 'site', 'size', 'skip', 'slab', 'slam', 'slap', 'sled', 'slew', 'slid', 'slim', 'slip', 'slit', 'slot', 'slow', 'slug', 'snap', 'snip', 'snow', 'soak', 'soap', 'soar', 'sock', 'soda', 'soft', 'soil', 'sold', 'sole', 'some', 'song', 'soon', 'sore', 'sort', 'soul', 'soup', 'sour', 'span', 'spar', 'spec', 'sped', 'spin', 'spit', 'spot', 'spur', 'stab', 'star', 'stay', 'stem', 'step', 'stew', 'stop', 'stow', 'stub', 'stud', 'such', 'suit', 'sulk', 'sure', 'surf', 'swam', 'swan', 'swap', 'swim',
  'tack', 'tail', 'take', 'tale', 'talk', 'tall', 'tame', 'tank', 'tape', 'task', 'taxi', 'team', 'tear', 'tell', 'tend', 'tent', 'term', 'test', 'text', 'than', 'that', 'them', 'then', 'they', 'thin', 'this', 'thus', 'tick', 'tidy', 'tied', 'tile', 'till', 'tilt', 'time', 'tiny', 'tire', 'toad', 'toes', 'told', 'toll', 'tomb', 'tone', 'took', 'tool', 'tops', 'tore', 'torn', 'toss', 'tour', 'town', 'trap', 'tray', 'tree', 'trek', 'trim', 'trio', 'trip', 'trod', 'trot', 'true', 'tube', 'tuck', 'tune', 'turn', 'twig', 'twin', 'type',
  'ugly', 'undo', 'unit', 'unto', 'upon', 'urge', 'used',
  'vain', 'vale', 'vast', 'veil', 'vein', 'vent', 'verb', 'very', 'vest', 'veto', 'view', 'vine', 'void', 'volt', 'vote',
  'wade', 'wage', 'wait', 'wake', 'walk', 'wall', 'wand', 'want', 'ward', 'warm', 'warn', 'warp', 'wash', 'vast', 'wave', 'wavy', 'waxy', 'weak', 'wear', 'weed', 'week', 'weld', 'well', 'went', 'were', 'west', 'what', 'when', 'whom', 'wide', 'wife', 'wild', 'will', 'wilt', 'wily', 'wind', 'wine', 'wing', 'wipe', 'wire', 'wise', 'wish', 'with', 'woke', 'wolf', 'wood', 'wool', 'word', 'wore', 'work', 'worm', 'worn', 'wrap', 'wren',
  'yard', 'yarn', 'year', 'yell', 'your',
  'zeal', 'zero', 'zinc', 'zone', 'zoom',
  // 5-letter
  'adapt', 'admit', 'adopt', 'adult', 'alarm', 'alert', 'alien', 'align', 'alive', 'alone', 'amaze', 'angel', 'anger', 'angle', 'apple', 'arena', 'argue', 'arise', 'avoid', 'awake', 'award', 'aware',
  'badge', 'baker', 'basic', 'beach', 'begin', 'being', 'below', 'bench', 'birth', 'black', 'blade', 'blame', 'bland', 'blank', 'blast', 'blaze', 'bleed', 'blend', 'bless', 'blind', 'bliss', 'block', 'blood', 'bloom', 'blown', 'board', 'boast', 'bonus', 'bound', 'brain', 'brand', 'brave', 'bread', 'break', 'breed', 'brick', 'bride', 'brief', 'bring', 'broad', 'broke', 'brook', 'brown', 'brush', 'build', 'built', 'bunch', 'burst',
  'cabin', 'camel', 'carry', 'catch', 'cause', 'cedar', 'chain', 'chair', 'chalk', 'charm', 'chase', 'cheap', 'check', 'cheek', 'cheer', 'chess', 'chest', 'chief', 'child', 'chill', 'china', 'chunk', 'civil', 'claim', 'class', 'clean', 'clear', 'clerk', 'cliff', 'climb', 'cling', 'clock', 'clone', 'close', 'cloth', 'cloud', 'clown', 'coach', 'coast', 'color', 'comet', 'coral', 'count', 'court', 'cover', 'crack', 'craft', 'crane', 'crash', 'crazy', 'cream', 'creek', 'crest', 'crime', 'crisp', 'cross', 'crowd', 'crown', 'cruel', 'crush', 'curve', 'cycle',
  'dance', 'death', 'delay', 'demon', 'dense', 'depth', 'devil', 'dirty', 'doubt', 'draft', 'drain', 'drake', 'drama', 'drank', 'drape', 'drawn', 'dream', 'dress', 'dried', 'drift', 'drill', 'drink', 'drive', 'drown', 'drunk', 'dwarf',
  'eager', 'early', 'earth', 'eight', 'elder', 'elect', 'elite', 'empty', 'enemy', 'enjoy', 'enter', 'equal', 'error', 'essay', 'event', 'every', 'exact', 'exist', 'extra',
  'fable', 'faint', 'faith', 'false', 'fault', 'feast', 'fence', 'fever', 'field', 'fight', 'final', 'flame', 'flare', 'flash', 'fleet', 'flesh', 'flock', 'flood', 'floor', 'flour', 'float', 'flute', 'focus', 'force', 'forge', 'forth', 'found', 'frame', 'frank', 'fraud', 'fresh', 'front', 'frost', 'fruit', 'funny',
  'giant', 'given', 'glare', 'glass', 'gleam', 'globe', 'gloom', 'glory', 'glove', 'going', 'grace', 'grade', 'grain', 'grand', 'grant', 'grape', 'grasp', 'grass', 'grave', 'graze', 'great', 'greed', 'green', 'greet', 'grief', 'grind', 'groan', 'groom', 'gross', 'group', 'grove', 'grown', 'guard', 'guess', 'guide', 'guilt',
  'happy', 'heart', 'heavy', 'hence', 'honor', 'horse', 'hotel', 'house', 'human', 'humor', 'hurry',
  'ideal', 'image', 'imply', 'index', 'inner', 'input',
  'jewel', 'joint', 'joker', 'judge', 'juice', 'jumbo',
  'knife', 'knock', 'known',
  'labor', 'large', 'laser', 'later', 'laugh', 'layer', 'learn', 'least', 'leave', 'legal', 'lemon', 'level', 'light', 'limit', 'linen', 'liver', 'local', 'lodge', 'logic', 'loose', 'lover', 'lower', 'lucky', 'lunar', 'lunch',
  'magic', 'major', 'maple', 'march', 'match', 'mayor', 'media', 'mercy', 'merit', 'metal', 'meter', 'might', 'minor', 'minus', 'model', 'money', 'month', 'moral', 'motor', 'mount', 'mouse', 'mouth', 'movie', 'music',
  'naked', 'nerve', 'never', 'night', 'noble', 'noise', 'north', 'noted', 'novel',
  'ocean', 'offer', 'often', 'olive', 'opera', 'orbit', 'order', 'organ', 'other', 'ought', 'outer', 'owner',
  'paint', 'panel', 'panic', 'paper', 'party', 'patch', 'pause', 'peace', 'peach', 'pearl', 'penny', 'phase', 'phone', 'photo', 'piano', 'piece', 'pilot', 'pitch', 'pixel', 'place', 'plain', 'plane', 'plant', 'plate', 'plead', 'pluck', 'plumb', 'plume', 'plump', 'point', 'polar', 'pound', 'power', 'press', 'price', 'pride', 'prime', 'print', 'prior', 'prize', 'probe', 'prone', 'proof', 'proud', 'prove', 'pulse', 'punch', 'pupil',
  'queen', 'query', 'quest', 'quick', 'quiet', 'quote',
  'radar', 'radio', 'raise', 'rally', 'ranch', 'range', 'rapid', 'ratio', 'reach', 'ready', 'realm', 'rebel', 'reign', 'relax', 'reply', 'rider', 'ridge', 'rifle', 'right', 'rigid', 'rival', 'river', 'robot', 'rocky', 'roman', 'rough', 'round', 'route', 'royal', 'ruins', 'ruler', 'rural',
  'saint', 'salad', 'scale', 'scare', 'scene', 'scope', 'score', 'scout', 'scrap', 'sense', 'serve', 'seven', 'shade', 'shake', 'shall', 'shame', 'shape', 'share', 'shark', 'sharp', 'shave', 'sheep', 'sheer', 'sheet', 'shelf', 'shell', 'shift', 'shine', 'shirt', 'shock', 'shoot', 'shore', 'short', 'shout', 'sight', 'since', 'skill', 'skull', 'slash', 'slave', 'sleep', 'slice', 'slide', 'slope', 'smart', 'smell', 'smile', 'smoke', 'snack', 'snake', 'solar', 'solid', 'solve', 'sorry', 'sound', 'south', 'space', 'spare', 'spark', 'speak', 'speed', 'spell', 'spend', 'spice', 'spill', 'spine', 'split', 'spoke', 'spoon', 'sport', 'spray', 'squad', 'stack', 'staff', 'stage', 'stain', 'stair', 'stake', 'stale', 'stall', 'stamp', 'stand', 'stare', 'start', 'state', 'stave', 'steak', 'steal', 'steam', 'steel', 'steep', 'steer', 'stern', 'stick', 'still', 'sting', 'stock', 'stole', 'stone', 'stood', 'stool', 'storm', 'story', 'stout', 'stove', 'strap', 'straw', 'stray', 'strip', 'stuck', 'study', 'stuff', 'style', 'suite', 'super', 'surge', 'swamp', 'swear', 'sweat', 'sweep', 'sweet', 'swell', 'swept', 'swift', 'swing', 'sword',
  'table', 'taken', 'taste', 'teach', 'their', 'theme', 'there', 'thick', 'thief', 'thing', 'think', 'third', 'thorn', 'those', 'three', 'threw', 'throw', 'thumb', 'tiger', 'tight', 'timer', 'tired', 'title', 'today', 'token', 'total', 'touch', 'tough', 'tower', 'trace', 'track', 'trade', 'trail', 'train', 'trait', 'trash', 'treat', 'trend', 'trial', 'tribe', 'trick', 'tried', 'truck', 'truly', 'trump', 'trunk', 'trust', 'truth', 'tutor', 'twice',
  'ultra', 'under', 'union', 'unite', 'unity', 'until', 'upper', 'upset', 'urban', 'usage', 'usual', 'utter',
  'valid', 'value', 'vault', 'venue', 'verse', 'vigor', 'viral', 'visit', 'vital', 'vivid', 'vocal', 'voice', 'voter',
  'waste', 'watch', 'water', 'weary', 'weave', 'weird', 'wheat', 'wheel', 'where', 'which', 'while', 'white', 'whole', 'whose', 'width', 'witch', 'woman', 'world', 'worry', 'worse', 'worst', 'worth', 'would', 'wound', 'wrath', 'write', 'wrong', 'wrote',
  'yacht', 'yield', 'young', 'youth',
])

/**
 * Generate a puzzle with a specific optimal path length.
 * Uses bounded BFS from a random start word to find an end word at the target distance.
 * Strongly prefers common, recognizable words for start and end.
 */
export function generatePuzzle(
  graph: WordGraph,
  options: GeneratorOptions
): Puzzle | null {
  const { targetPathLength, activeMoveTypes, prng = Math.random } = options

  // Use common words for start words (much better UX)
  const goodWords = Array.from(GOOD_PUZZLE_WORDS).filter(w => graph.wordSet.has(w))
  const maxAttempts = 100

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const startWord = goodWords[Math.floor(prng() * goodWords.length)]

    // Bounded BFS to find words at exactly the target distance
    const visited = new Set<string>([startWord])
    let frontier: string[] = [startWord]
    let depth = 0

    while (depth < targetPathLength && frontier.length > 0) {
      const nextFrontier: string[] = []
      for (const word of frontier) {
        for (const neighbor of getNeighbors(word, graph, activeMoveTypes)) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            nextFrontier.push(neighbor)
          }
        }
      }
      frontier = nextFrontier
      depth++
    }

    if (depth === targetPathLength && frontier.length > 0) {
      // Strongly prefer common words as end words
      const commonCandidates = frontier.filter(w => GOOD_PUZZLE_WORDS.has(w))
      const candidates = commonCandidates.length > 0 ? commonCandidates : frontier.filter(w => w.length >= 3 && w.length <= 5)
      if (candidates.length === 0) continue
      const endWord = candidates[Math.floor(prng() * candidates.length)]

      return {
        startWord,
        endWord,
        activeMoveTypes,
        optimalLength: targetPathLength,
      }
    }
  }

  return null
}
