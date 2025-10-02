# git-yolo.ps1
$msg = Invoke-RestMethod https://whatthecommit.com/index.txt
git commit -m $msg
