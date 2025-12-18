import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language || 'en';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground h-8 sm:h-9 px-2 sm:px-3"
        >
          <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-[10px] sm:text-xs font-medium">
            {currentLanguage === 'ar' ? 'العربية' : 'EN'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[100px] sm:min-w-[120px]">
        <DropdownMenuItem
          onClick={() => changeLanguage('en')}
          className={currentLanguage === 'en' ? 'bg-secondary' : ''}
        >
          <span className="flex items-center justify-between w-full">
            <span>English</span>
            {currentLanguage === 'en' && (
              <span className="text-primary">✓</span>
            )}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('ar')}
          className={currentLanguage === 'ar' ? 'bg-secondary' : ''}
        >
          <span className="flex items-center justify-between w-full">
            <span>العربية</span>
            {currentLanguage === 'ar' && (
              <span className="text-primary">✓</span>
            )}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

