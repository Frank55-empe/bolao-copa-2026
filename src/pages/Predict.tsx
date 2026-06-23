const { matchId } = useParams();
const location = useLocation();
const navigate = useNavigate();

const [match, setMatch] = useState<MatchData | null>(
  (location.state as MatchData) || null
);

useEffect(() => {
  if (!match) {
  return (
    <div className="flex justify-center items-center h-screen">
      Carregando...
    </div>
  );

      if (found) {
        setMatch(found);
      } else {
        navigate('/jogos');
      }
    });
  }
}, [match, matchId, navigate]);
