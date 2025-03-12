import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  ArrowLeft, 
  AlertCircle, 
  Loader2, 
  LogOut, 
  Edit, 
  Check, 
  X, 
  Camera
} from 'lucide-react';
import { avatarOptions } from '../utils/avatars';

export default function ProfilePage() {
  const { user, token, logout, updateProfile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarId, setAvatarId] = useState(1);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [fadeSuccess, setFadeSuccess] = useState(false);
  
  // Get avatar by ID
  const getAvatar = (id) => {
    return avatarOptions.find(avatar => avatar.id === id) || avatarOptions[0];
  };
  
  // Clear success message after timeout with fade effect
  useEffect(() => {
    let fadeTimer;
    let removeTimer;
    
    if (formSuccess) {
      // Start fade out after 1.5 seconds
      fadeTimer = setTimeout(() => {
        setFadeSuccess(true);
      }, 1500);
      
      // Remove message after fade completes (2 seconds total)
      removeTimer = setTimeout(() => {
        setFormSuccess('');
        setFadeSuccess(false);
      }, 2000);
    }
    
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [formSuccess]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Set initial form values
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setAvatarId(user.avatarId || 1);
    }
  }, [user]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!name || !username) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setFormError('');
    setFormSuccess('');
    
    try {
      const result = await updateUserProfile({ name, username, avatarId }, token);
      
      if (result.success) {
        updateProfile(result.user);
        setFormSuccess('Profile updated successfully');
        setIsEditing(false);
        setShowAvatarSelector(false);
      } else {
        setFormError(result.message);
      }
    } catch (error) {
      setFormError('An unexpected error occurred. Please try again.');
      console.error('Profile update error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const cancelEdit = () => {
    setName(user?.name || '');
    setUsername(user?.username || '');
    setAvatarId(user?.avatarId || 1);
    setFormError('');
    setIsEditing(false);
    setShowAvatarSelector(false);
  };
  
  const handleAvatarSelect = (id) => {
    setAvatarId(id);
    setShowAvatarSelector(false);
  };
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }
  
  const currentAvatar = getAvatar(avatarId);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-white">
      {/* Success Message Toast */}
      {formSuccess && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${
          fadeSuccess 
            ? 'opacity-0 -translate-y-full scale-95' 
            : 'opacity-100 translate-y-0 scale-100'
        }`}>
          <Alert className="bg-teal-600 border-teal-700 text-white shadow-lg px-6 py-4 rounded-lg animate-bounce-small">
            <Check className="h-5 w-5 mr-2" />
            <AlertDescription className="font-medium">{formSuccess}</AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        
        <div className="relative">
          {/* Profile Content */}
          <Card className="bg-slate-800/90 border-slate-700 shadow-xl rounded-3xl relative z-10 backdrop-blur-sm">
            <CardContent className="p-0">
              {/* Profile Avatar and Basic Info */}
              <div className="flex flex-col items-center pt-12 pb-6 border-b border-slate-700/50">
                <div className="relative group">
                  <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-slate-800 shadow-lg mb-6 transition-transform duration-300 ease-in-out transform group-hover:scale-105">
                    <div className={`h-full w-full bg-gradient-to-r ${currentAvatar.bgColor}`}>
                      <img 
                        src={currentAvatar.image} 
                        alt={currentAvatar.name}
                        className="w-[75%] h-[75%] object-contain absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      />
                    </div>
                  </div>
                  
                  {isEditing && (
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute bottom-4 right-0 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors duration-200"
                      onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {showAvatarSelector && (
                    <div className="absolute top-full mt-2 bg-slate-800 rounded-xl p-4 shadow-xl border border-slate-700 z-20 w-80 -left-24">
                      <h3 className="text-sm font-medium mb-3 text-slate-300">{currentAvatar.name}</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {avatarOptions.map(avatar => (
                          <button
                            key={avatar.id}
                            className={`p-1 rounded-xl bg-gradient-to-r ${avatar.bgColor} transition-transform duration-200 hover:scale-105 overflow-hidden ${
                              avatarId === avatar.id ? 'ring-2 ring-white scale-105' : ''
                            }`}
                            onClick={() => handleAvatarSelect(avatar.id)}
                          >
                            <div className="aspect-square rounded-lg overflow-hidden bg-white/5 backdrop-blur-sm">
                              <img 
                                src={avatar.image} 
                                alt={avatar.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {!isEditing ? (
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
                    <p className="text-teal-400">@{user.username}</p>
                  </div>
                ) : null}
              </div>
              
              {/* Profile Form */}
              <div className="p-6">
                {formError && (
                  <Alert variant="destructive" className="mb-4 bg-red-900/30 border-red-900 text-red-300">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-slate-300">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-slate-700/50 border-slate-600 focus:border-teal-500 focus:ring-teal-500"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium text-slate-300">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-slate-700/50 border-slate-600 focus:border-teal-500 focus:ring-teal-500"
                        required
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <Button 
                        type="submit" 
                        className="bg-teal-600 hover:bg-teal-700 rounded-full px-6 transition-colors duration-200"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        type="button"
                        variant="outline" 
                        className="border-slate-600 text-slate-300 hover:bg-slate-700/50 rounded-full transition-colors duration-200"
                        onClick={cancelEdit}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-700/20 p-5 rounded-xl border border-slate-700/50">
                        <p className="text-sm text-slate-400 mb-1">Name</p>
                        <p className="text-lg font-medium">{user.name}</p>
                      </div>
                      
                      <div className="bg-slate-700/20 p-5 rounded-xl border border-slate-700/50">
                        <p className="text-sm text-slate-400 mb-1">Username</p>
                        <p className="text-lg font-medium">@{user.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button 
                        className="bg-teal-600 hover:bg-teal-700 rounded-full px-6 transition-colors duration-200"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                      
                      <Button 
                        className="bg-red-600 hover:bg-red-700 rounded-full px-6 transition-colors duration-200"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 