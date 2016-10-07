<?php
include '../global.php';

// ccpc girls round
$cid = 697;

// contest information
$cinfo = $db->get_one("SELECT contestname, starttime, lastingtime, closeranktime FROM contest_list WHERE contestid = $cid");
$reveal = $cinfo['starttime'] + $cinfo['lastingtime'] - $cinfo['closeranktime'];

// problems
$problems = array();
$fbs = array();
$res = $db->query("SELECT problemid FROM contest_problem WHERE contestid = $cid ORDER BY problemid ASC");
while ($row = $db->fetch_array($res)) {
  $pid = $row['problemid'];
  $fb = $db->get_one("SELECT userid FROM contest_submit WHERE contestid = $cid AND problemid = $pid AND accepted = 1 ORDER BY accepttime ASC LIMIT 1");
  $problems[] = $pid;
  $fbs[$pid] = $fb['userid'];
}

// ranklist
$users = array();
$res = $db->query("SELECT cu.userid, cu.nickname, problemid, accepttime, submits, accepted FROM contest_submit AS cs INNER JOIN contest_user AS cu ON cs.contestid = cu.contestid AND cs.userid = cu.userid WHERE cu.contestid = $cid");
while ($row = $db->fetch_array($res)) {
  $user = $users[$row['userid']];
  if (!$user) {
    $user = array(
      'team' => mb_convert_encoding($row['nickname'], 'UTF-8', 'GB2312'),
      'rank' => 0,
      'solves' => 0,
      'penalty' => 0,
      'problems' => array(),
    );
    $users[$row['userid']] = $user;
  }

  $closes = $db->get_one("SELECT COUNT(*) as count FROM contest_status_$cid WHERE userid = {$row['userid']} AND problemid = {$row['problemid']} AND submittime >= $reveal");
  $user['problems'][$row['problemid']] = array(
    'id' => $row['problemid'],
    'solved' => $row['accepted'] == 1 ? true : false,
    'time' => intval($row['accepttime']),
    'submits' => intval($row['submits']),
    'reveal' => intval($closes['count']),
  );

  if ($closes['count'] == 0) {
    $user['solves']++;
    $user['penalty'] += intval($row['accepttime']);
  }
}

function cmp_problem($p1, $p2) {
  return $p1['id'] < $p2['id'];
}
foreach ($users as $user) {
  usort($user['problems'], cmp_problem);
}
function cmp_user($u1, $u2) {
  if ($u1['solves'] == $u1['solves']) {
    if ($u1['penalty'] == $u2['penalty']) {
      return strcmp($u1['team'], $u2['team']);
    } else {
      return $u1['penalty'] < $u2['penalty'];
    }
  } else {
    return $u1['solves'] > $u2['solves'];
  }
}
usort($users, cmp_user);

$count = count($users);
for ($i = 0; $i < $count; $i++) {
  $users[$i]['rank'] = $i + 1;
}

// history
$history = json_decode(file_get_contents('storage/history.json'));

header('Content-Type: application/json');
exit(json_encode(array(
  'title' => mb_convert_encoding($cinfo['contestname'], 'UTF-8', 'GB2312'),
  'problems' => $problems,
  'rank' => $users,
  'history' => $history,
)));
