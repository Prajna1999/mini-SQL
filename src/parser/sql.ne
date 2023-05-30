# Grammar in NE format
@{%
const id = x => x[0];
%}

select -> keyword _ column _ "from" _ table _ {% function(d) { return { type: d[0].toLowerCase(), column: d[2], table: d[6] }; } %}
column -> word    {% id %}
table  -> word    {% id %}
keyword -> "select"i {% id %}
word -> [a-z]+  {% id %}
_ -> " "*       {% null %}
