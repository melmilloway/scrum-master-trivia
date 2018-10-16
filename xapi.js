var score;

//
// Generate random email address for user
//

// Generate random email address for user
var email = localStorage.getItem('email');

if (email === null) {
  var num = Math.floor(Math.random() * 50000) + 1;
  
  email = 'ScrumMasterUser' + num + '@scrum.com';

  localStorage.setItem('email', email);
}

//
// xAPI variables and config
//
var conf = {  
  'endpoint': 'https://trial-lrs.yetanalytics.io/xapi/',  // Put your LRS endpoint here with a / after xapi.
  'auth': 'Basic ' + toBase64('2584767e4c17c04cea78e0fc79633110:8124da2d6292539fc1ca70423cb1bbc1') // Put your LRS username in, then a colon, and then your password. No spaces. 
};

ADL.XAPIWrapper.changeConfig(conf);

//
// Sort objects by key
//
function sortByKey(array, key) {
  return array.sort(function(a, b) {
    var x = a[key] || 0;
    var y = b[key] || 0;
    return (x > y ? -1 : (x < y ? 1 : 0));
  });
}

function send_statement(verbId, verb, objectId, name, description, score, success) {
  var player = GetPlayer();
  var userName = player.GetVar('userName'); 
  var score = player.GetVar('score');

  // define the xapi statement being sent  
  var statement = {  
    'actor': {  
      'mbox': 'mailto:' + email,
      'name': userName,  
      'objectType': 'Agent'  
    },  
    'verb': {  
       'id': verbId,  
      'display': {'en-US': verb}  
    }, 
    'object': { 
      'id': objectId,  
      'definition': {  
        'name': {
          'en-US': name
        },  
        'description': {
          'en-US': description
        }  
      },  
      'objectType': 'Activity' 
    },
    'result': {
      'score': {
        'scaled': 1,
        'min': 0,
        'max': 115,
        'raw': score
      },
      'success': success
    }
  }; // end statement definition  
   
  // Dispatch the statement to the LRS  
  var result = ADL.XAPIWrapper.sendStatement(statement);
}

function getUserInfo(currentUser) {
  var params = ADL.XAPIWrapper.searchParams(); 

  // Enter the ID for the statements that you would like to pull 
  params['verb'] = 'http://example.com/xapi/completed';
  var completed = ADL.XAPIWrapper.getStatements(params);
  var completedArr = completed.statements;

  while (completed.more) {
    completed = ADL.XAPIWrapper.getStatements(null, completed.more);
    completedArr = completedArr.concat(completed.statements);
  }

  if (completedArr.length) {
    var resultArr = [];

    for (var i = 0; i < completedArr.length; i++) {
      resultArr.push({
        email: completedArr[i].actor.mbox,
        name: completedArr[i].actor.name,
        score: completedArr[i].result.score.raw
      });
    }

    var sortedArr = sortByKey(resultArr, 'score');

    return currentUser ? [sortedArr, completedArr[0].actor.mbox] : sortedArr;
  }
}

function get_leaderboard() {
  var topScoresArr = getUserInfo(false);
  topScoresArr = topScoresArr.slice(0, 5);

  var params = ADL.XAPIWrapper.searchParams(); 
  
  // Enter the ID for the statements that you would like to pull 
  params['verb'] = 'http://example.com/xapi/preferred';
  var preferred = ADL.XAPIWrapper.getStatements(params);
  var preferredArr = preferred.statements;

  while (preferred.more) {
    preferred = ADL.XAPIWrapper.getStatements(null, preferred.more);
    preferredArr = preferredArr.concat(preferred.statements);
  }

  if (preferredArr.length) {
    var email = '';

    for (i = 0; i < topScoresArr.length; i++) {
      email = topScoresArr[i].email;

      for (var j = 0; j < preferredArr.length; j++) {
        if (preferredArr[j].actor.mbox === email) {
          topScoresArr[i].avatar = preferredArr[j].object.definition.name['en-US'];
        }
      }

      if (!topScoresArr[i].avatar) {
        topScoresArr[i].avatar = 'none';
      }
    }
    
    var player = GetPlayer();
    player.SetVar('name1', topScoresArr[0].name);
    player.SetVar('score1', topScoresArr[0].score);
    player.SetVar('avatar1', topScoresArr[0].avatar);
    player.SetVar('name2', topScoresArr[1].name);
    player.SetVar('score2', topScoresArr[1].score);
    player.SetVar('avatar2', topScoresArr[1].avatar);
    player.SetVar('name3', topScoresArr[2].name);
    player.SetVar('score3', topScoresArr[2].score);
    player.SetVar('avatar3', topScoresArr[2].avatar);
    player.SetVar('name4', topScoresArr[3].name);
    player.SetVar('score4', topScoresArr[3].score);
    player.SetVar('avatar4', topScoresArr[3].avatar);
    player.SetVar('name5', topScoresArr[4].name);
    player.SetVar('score5', topScoresArr[4].score);
    player.SetVar('avatar5', topScoresArr[4].avatar);
  }
}

function get_count() {
  var params = ADL.XAPIWrapper.searchParams(); 

  // Enter the ID for the statements that you would like to pull 
  params['verb'] = 'http://example.com/xapi/answered';
  var answered = ADL.XAPIWrapper.getStatements(params);
  var answeredArr = answered.statements;

  while (answered.more) {
    answered = ADL.XAPIWrapper.getStatements(null, answered.more);
    answeredArr = answeredArr.concat(answered.statements);
  }

  var answerCount = {};

  for (var i = 0; i < answeredArr.length; i++) {
    if (answerCount[answeredArr[i].object.definition.name['en-US']]) {
      answerCount[answeredArr[i].object.definition.name['en-US']] += 1;
    } else {
      answerCount[answeredArr[i].object.definition.name['en-US']] = 1;
    }
  }

  var player = GetPlayer();
  player.SetVar('q1a1ppl', answerCount['framework']);
  player.SetVar('q1a2ppl', answerCount['project management tool']);
  player.SetVar('q1a3ppl', answerCount['rocket design methodology']);
  player.SetVar('q2a1ppl', answerCount['scientific discoveries']);
  player.SetVar('q2a2ppl', answerCount['continuous improvements']);
  player.SetVar('q2a3ppl', answerCount['organizational change']);
  player.SetVar('q3a1ppl', answerCount['evidence based']);
  player.SetVar('q3a2ppl', answerCount['project manager leads']);
  player.SetVar('q3a3ppl', answerCount['few set rules']);
}

function get_rank() {
  var rankedData = getUserInfo(true);

  var topScoresArr = rankedData[0];
  var currentUser = rankedData[1];
  var rank = 0;

  for (var i = 0; i < topScoresArr.length; i++) {
    if (topScoresArr[i].email === currentUser) {
      rank = i + 1;
      break;
    }
  }

  var player = GetPlayer();
  player.SetVar('r', rank);
}
