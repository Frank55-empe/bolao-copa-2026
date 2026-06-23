const { matchId } = useParams();
const location = useLocation();
const navigate = useNavigate();

const [match, setMatch] = useState<MatchData | null>(
  (location.state as MatchData) || null
);

useEffect(() => {
  if (!match && matchId) {
    api.getMatches().then(matches => {
      const found = matches.find(
        m => String(m.id).trim() === String(matchId).trim()
      );

      if (found) {
        setMatch(found);
      } else {
        navigate('/jogos');
      }
    });
  }
}, [match, matchId, navigate]);
