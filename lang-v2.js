/* EN / FR switch for the v2 page. English is the HTML itself; FR maps each English text (whitespace-collapsed) to its French HTML.
   The choice is shared with the project pages (same localStorage key). */
(function () {
  const FR = {
 "Skip to content": "Aller au contenu",
 "About": "À propos",
 "Skills": "Compétences",
 "Experience": "Expérience",
 "Projects": "Projets",
 "Contact": "Contact",
 "France": "France",
 "Available · seeking a 6-month end-of-studies robotics internship · 2027": "Disponible · à la recherche d'un stage de fin d'études de 6 mois en robotique · 2027",
 "Robotics engineer in training, building robots that perceive, plan and learn, from simulation to real hardware.": "Élève ingénieure en robotique, je conçois <b>des robots qui perçoivent, planifient et apprennent</b>, de la simulation au matériel réel.",
 "See my projects": "Voir mes projets",
 "Download CV": "Télécharger le CV",
 "Video CV": "CV vidéo",
 "Video CV ↗": "CV vidéo ↗",
 "Scroll down": "Défiler",
 "Hi there!": "Bonjour !",
 "currently": "actuellement",
 "Clermont-Ferrand, France": "Clermont-Ferrand, France",
 "studying": "études",
 "Robotics & Mechatronics": "Robotique &amp; mécatronique",
 "looking for": "recherche",
 "6-month internship · 2027": "Stage de 6 mois · 2027",
 "languages": "langues",
 "EN · FR · AR · TR": "EN · FR · AR · TR",
 "click to flip": "cliquer pour retourner",
 "I design and build intelligent robotic systems, bridging AI, control and mechanical engineering to bring ideas from simulation to real-world applications.": "Je conçois et construis des systèmes robotiques intelligents, à la croisée de l'IA, de l'automatique et de la mécanique, pour faire passer les idées de la simulation aux applications réelles.",
 "Final-year engineering student on a double degree: Mechatronics at ENISo (Tunisia) and Innovative Mechanisms & Robots at SIGMA Clermont (France). Two diplomas on the way, because apparently one wasn't enough, and neither was hardware alone, so I started teaching robots to learn.": "Élève ingénieure en dernière année de <b>double diplôme</b> : <b>mécatronique</b> à l'ENISo (Tunisie) et <b>Mécanismes et Robots Innovants</b> à SIGMA Clermont (France). Deux diplômes en route, parce qu'apparemment un seul ne suffisait pas, et le matériel seul non plus, alors j'ai commencé à <b>apprendre aux robots à apprendre</b>.",
 "Right now I'm looking for a 6-month end-of-studies internship where I can keep pursuing what I love: robots that see, move and learn.": "Je recherche actuellement un <b>stage de fin d'études de 6 mois</b> pour continuer à faire ce que j'aime : des robots qui <b>voient</b>, <b>bougent</b> et <b>apprennent</b>.",
 "I like building things, breaking them in simulation first, and occasionally wondering why my robot decided the wall was the optimal policy.": "J'aime <b>construire des choses</b>, les casser <b>d'abord en simulation</b>, et me demander de temps en temps pourquoi mon robot a décidé que le mur était la <b>politique optimale</b>.",
 "Toolbox": "Boîte à outils",
 "What I build with": "Mes outils",
 "Languages": "Langages",
 "Robotics & simulation": "Robotique &amp; simulation",
 "AI · ML · Deep RL": "IA · ML · Deep RL",
 "Design & tools": "Conception &amp; outils",
 "Where I've been": "Mon parcours",
 "CIAD lab, UTBMResearch intern": "Laboratoire CIAD, UTBM<em>Stagiaire de recherche</em>",
 "SIGMA ClermontREMAIN bin-picking project": "SIGMA Clermont<em>Projet de bin-picking REMAIN</em>",
 "CASCO AutomotiveEngineering intern": "CASCO Automotive<em>Stagiaire ingénieure</em>",
 "EducationDouble degree": "Formation<em>Double diplôme</em>",
 "May 2026 – Sep 2026 · Montbéliard, France": "Mai 2026 – sept. 2026 · Montbéliard, France",
 "Research intern, deep RL for robot control": "Stagiaire de recherche, deep RL pour la commande de robots",
 "CIAD lab, UTBM": "<img class=\"org-logo\" src=\"assets/img/orgs/ciad.png\" alt=\"CIAD logo\">Laboratoire CIAD, UTBM",
 "Whole-body control of a mobile manipulator (AgileX Scout 2.0 base + Doosan 6-axis arm) simulated in Unity ML-Agents.": "Commande corps complet d'un manipulateur mobile (base AgileX Scout 2.0 + bras Doosan 6 axes) simulé dans Unity ML-Agents.",
 "Trained PPO policies (Stable-Baselines3) in two architectures: end-to-end, and hybrid, where the policy tunes a model-based PBVS + WDLS controller provided by the lab (developed by another intern), which I ported to Unity.": "Entraînement de politiques PPO (Stable-Baselines3) selon deux architectures : bout-en-bout, et hybride, où la politique règle un contrôleur basé modèle PBVS + WDLS fourni par le laboratoire (développé par un·e autre stagiaire), que j'ai porté sous Unity.",
 "End-to-end reached the target in 8.3 s with 13 mm error. The hybrid policy gave the most direct paths (ratio 1.09 vs 3.28).": "Le bout-en-bout atteint la cible en 8,3 s avec 13 mm d'erreur. La politique hybride donne les trajectoires les plus directes (ratio 1,09 contre 3,28).",
 "2025 – 2026 · Clermont-Ferrand, France": "2025 – 2026 · Clermont-Ferrand, France",
 "Annual team project, 3D perception & bin-picking": "Projet annuel en équipe, perception 3D &amp; bin-picking",
 "European project REMAIN · real UR3e arm": "<img class=\"org-logo\" src=\"assets/img/orgs/sigma.png\" alt=\"SIGMA Clermont logo\">Projet européen REMAIN · bras UR3e réel",
 "Trained a YOLOv11s-seg model on ~1,200 hand-labelled images to find shoes and their holes.": "Entraînement d'un modèle YOLOv11s-seg sur ~1 200 images annotées à la main pour détecter les chaussures et leurs trous.",
 "Grasp pose from PCA on the mask, back-projected with depth; hand-eye calibration with ArUco markers.": "Pose de saisie par ACP sur le masque, rétroprojetée avec la profondeur ; calibration main-œil avec des marqueurs ArUco.",
 "10-step MoveIt 2 pick-and-place sequence run on the real robot.": "Séquence pick-and-place MoveIt 2 en 10 étapes exécutée sur le robot réel.",
 "Jul 2025 – Aug 2025 · Tunisia": "Juil. 2025 – août 2025 · Tunisie",
 "Engineering intern, automation & machine vision": "Stagiaire ingénieure, automatisation &amp; vision industrielle",
 "CASCO Automotive": "CASCO Automotive",
 "Deployed real-time machine-vision quality control with a Keyence camera.": "Déploiement d'un contrôle qualité par vision en temps réel avec une caméra Keyence.",
 "Programmed an automated assembly station for high-voltage components.": "Programmation d'un poste d'assemblage automatisé pour des composants haute tension.",
 "Convergence Forum ENISoWorkshop Area Manager": "Forum Convergence ENISo<em>Responsable Espace Workshop</em>",
 "2024 – 2025 · Sousse, Tunisia": "2024 – 2025 · Sousse, Tunisie",
 "Workshop Area Manager": "Responsable Espace Workshop",
 "Convergence Forum ENISo": "<img class=\"org-logo\" src=\"assets/img/orgs/eniso.png\" alt=\"ENISo logo\">Forum Convergence ENISo",
 "Ran the workshop area of an international forum with 2,000+ participants.": "Gestion de l'espace workshop d'un forum international de plus de 2 000 participants.",
 "Education": "Formation",
 "Engineering degree, Innovative Mechanisms & RobotsSIGMA Clermont (Clermont Auvergne INP), France · double degree": "<img class=\"org-logo\" src=\"assets/img/orgs/sigma.png\" alt=\"SIGMA Clermont logo\"><b>Diplôme d'ingénieur, Mécanismes et Robots Innovants</b>SIGMA Clermont (Clermont Auvergne INP), France · double diplôme",
 "National engineering degree, MechatronicsENISo, Sousse, Tunisia": "<img class=\"org-logo\" src=\"assets/img/orgs/eniso.png\" alt=\"ENISo logo\"><b>Diplôme national d'ingénieur, mécatronique</b>ENISo, Sousse, Tunisie",
 "Preparatory classes, Mathematics & PhysicsIPEIB, Bizerte, Tunisia": "<img class=\"org-logo\" src=\"assets/img/orgs/ipeib.png\" alt=\"IPEIB logo\"><b>Classes préparatoires, mathématiques &amp; physique</b>IPEIB, Bizerte, Tunisie",
 "My projects": "Mes projets",
 "Annual project · in pairs": "Projet annuel · en binôme",
 "A UR3e controlled in real time from camera feedback: visual servoing combined with AI-based perception.": "Un UR3e commandé en temps réel à partir du retour caméra : asservissement visuel combiné à une perception par IA.",
 "Deep-learning detection and pose estimation (RealSense)": "Détection et estimation de pose par deep learning (RealSense)",
 "Visual servoing: closed-loop control from the image": "Asservissement visuel : commande en boucle fermée à partir de l'image",
 "Servo-guided pick-and-place": "Pick-and-place guidé par l'asservissement visuel",
 "Team project · Visual servoing · Deep learning · ROS 2": "Projet d'équipe · Asservissement visuel · Deep learning · ROS 2",
 "Measuring the forces needed to separate objects for recycling, and preparing a dataset for imitation learning.": "Mesurer les efforts nécessaires pour séparer des objets à recycler, et préparer une base de données pour l'apprentissage par imitation.",
 "Dataset of grasps, motions and forces": "Base de données des saisies, mouvements et efforts",
 "Next step: imitation learning": "Étape suivante : apprentissage par imitation",
 "Annual project · Two UR arms · Imitation learning": "Projet annuel · Deux bras UR · Apprentissage par imitation",
 "Currently building": "En cours de réalisation",
 "In progress": "En cours",
 "Team project": "Projet d'équipe",
 "3D-printed holding fixture": "Outil de maintien imprimé en 3D",
 "Force/torque sensor integration": "Intégration de capteurs d'effort",
 "Tests and validation": "Tests et validation",
 "AI-driven visual servoing on a UR3e": "Asservissement visuel piloté par l'IA sur un UR3e",
 "Robotic force measurement for object recycling": "Système robotique de mesure des efforts pour le recyclage d'objets",
 "All": "Tous",
 "Deep RL": "Deep RL",
 "Hardware": "Matériel",
 "Vision": "Vision",
 "Simulation": "Simulation",
 "move your cursor · set the target": "bougez la souris · placez la cible",
 "Whole-body control with deep RL": "Commande corps complet par deep RL",
 "Research internship · PPO · Unity": "Stage de recherche · PPO · Unity",
 "move your cursor · place the goal": "bougez la souris · placez l'objectif",
 "RL navigation from scratch": "Navigation par RL, from scratch",
 "PyTorch · DQN · Actor-Critic": "PyTorch · DQN · Actor-Critic",
 "move your cursor · drive the robot": "bougez la souris · pilotez le robot",
 "SLAM & autonomous navigation": "SLAM &amp; navigation autonome",
 "ROS 2 · Gazebo · slam_toolbox · Nav2": "ROS 2 · Gazebo · slam_toolbox · Nav2",
 "hover a shoe · see its grasp": "survolez une chaussure · voyez sa saisie",
 "3D perception & bin-picking": "Perception 3D &amp; bin-picking",
 "Real UR3e · ROS 2 · YOLOv11 · MoveIt 2": "UR3e réel · ROS 2 · YOLOv11 · MoveIt 2",
 "move your cursor · move the camera": "bougez la souris · déplacez la caméra",
 "Augmented reality chess": "Échecs en réalité augmentée",
 "Camera calibration · PnP · OpenGL": "Calibration caméra · PnP · OpenGL",
 "Coursework": "Travaux de cours",
 "Robotics fundamentals": "Fondamentaux de la robotique",
 "move your cursor": "bougez la souris",
 "Pose control of a KUKA LWR4": "Commande en pose d'un KUKA LWR4",
 "Dual quaternions · Octave": "Quaternions duaux · Octave",
 "Kinematics of serial arms": "Cinématique des bras sériels",
 "FK / IK · SE(3) pose control · Octave": "MGD / MGI · commande en pose sur SE(3) · Octave",
 "Geometry of rigid motion": "Géométrie du mouvement rigide",
 "Plücker lines · Rodrigues · screw theory": "Droites de Plücker · Rodrigues · théorie des torseurs",
 "move your cursor · turn the view": "bougez la souris · tournez la vue",
 "Robust line fitting with RANSAC": "Ajustement robuste de droite par RANSAC",
 "χ² threshold · adaptive trials · Octave": "Seuil χ² · nombre d'essais adaptatif · Octave",
 "your cursor is an outlier": "votre souris est une donnée aberrante",
 "move your cursor · turn the crank": "bougez la souris · tournez la manivelle",
 "Four-bar linkage in MSC Adams": "Mécanisme quatre barres sous MSC Adams",
 "Constraints · singularities": "Contraintes · singularités",
 "Let's buildsomething.": "Construisons<br>quelque chose.",
 "Open to a 6-month end-of-studies robotics internship starting in 2027.": "Ouverte à un stage de fin d'études de 6 mois en robotique à partir de 2027.",
 "farah.ben_slimene@sigma-clermont.fr": "farah.ben_slimene@sigma-clermont.fr",
 "LinkedIn ↗": "LinkedIn ↗",
 "GitHub ↗": "GitHub ↗",
 "Farah Ben Slimene · Clermont-Ferrand, France": "Farah Ben Slimene · Clermont-Ferrand, France",
 "Thanks for scrolling all the way down :)": "Merci d'avoir défilé jusqu'en bas :)",
 "Back to top ↑": "Retour en haut ↑",
 "View project →": "Voir le projet <i>→</i>",
 "Farah Ben Slimene · Robotics Engineering Student": "Farah Ben Slimene · Élève ingénieure en robotique",
 "Farah Ben Slimene: final-year robotics and mechatronics engineering student. Perception, control and deep reinforcement learning, on real robots and in simulation.": "Farah Ben Slimene : élève ingénieure en dernière année de robotique et mécatronique. Perception, commande et apprentissage par renforcement profond, sur robots réels et en simulation.",
 "Flip the photo": "Retourner la photo",
 "Filter projects": "Filtrer les projets"
};
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'SVG', 'CANVAS', 'PRE', 'CODE', 'VIDEO', 'IMG', 'NOSCRIPT']);
  const SKIP_CLS = ['slam-hud', 'lang-sw', 'mark', 'chips', 'tools', 'name'];
  const LETTER = /[A-Za-zÀ-ÿ]/;
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const nodes = [], missing = [];
  function walk(el) {
    for (const ch of el.children) {
      if (SKIP_TAGS.has(ch.tagName.toUpperCase())) continue;
      if (SKIP_CLS.some((c) => ch.classList.contains(c))) continue;
      let direct = '';
      for (const t of ch.childNodes) if (t.nodeType === 3) direct += t.nodeValue;
      if (LETTER.test(direct)) {
        const key = norm(ch.textContent);
        if (FR[key] !== undefined) nodes.push([ch, key, ch.innerHTML]); else missing.push(key);
        continue;
      }
      walk(ch);
    }
  }
  walk(document.body);
  const attrs = [];
  document.querySelectorAll('[aria-label]').forEach((el) => { const k = norm(el.getAttribute('aria-label')); if (FR[k] !== undefined) attrs.push([el, k]); });
  window.__i18nMissing = missing;

  const meta = document.querySelector('meta[name="description"]');
  const enTitle = document.title, enDesc = meta ? meta.content : '';
  let lang = 'en';
  try { lang = localStorage.getItem('lang') === 'fr' ? 'fr' : 'en'; } catch (e) { /* storage unavailable */ }
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'fr' || q === 'en') lang = q;
  window.__lang = () => lang;

  const sw = document.createElement('div');
  sw.className = 'lang-sw';
  sw.setAttribute('role', 'group');
  sw.setAttribute('aria-label', 'Language / Langue');
  sw.innerHTML = '<button type="button" data-l="en" lang="en">EN</button><button type="button" data-l="fr" lang="fr">FR</button>';
  const bar = document.querySelector('.bar'), cta = document.querySelector('.bar > .cv-split, .bar > .bar-cta');
  if (bar) bar.insertBefore(sw, cta);
  sw.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) apply(b.dataset.l, true); });

  function apply(l, save) {
    lang = l;
    const fr = l === 'fr';
    for (const [el, key, en] of nodes) el.innerHTML = fr ? FR[key] : en;
    for (const [el, key] of attrs) { if (!el.dataset.enLabel) el.dataset.enLabel = el.getAttribute('aria-label'); el.setAttribute('aria-label', fr ? FR[key] : el.dataset.enLabel); }
    document.title = fr && FR[norm(enTitle)] ? FR[norm(enTitle)] : enTitle;
    if (meta) meta.content = fr && FR[norm(enDesc)] ? FR[norm(enDesc)] : enDesc;
    document.documentElement.lang = l;
    sw.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l === l)));
    if (save) { try { localStorage.setItem('lang', l); } catch (e) { /* storage unavailable */ } }
    document.dispatchEvent(new CustomEvent('langchange', { detail: l }));
  }
  apply(lang, false);
})();
